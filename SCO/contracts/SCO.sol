// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Smart Contract Orchestrator (SCO)
 * @notice Thin on-chain façade that matches the paper's design:
 *         - Round lifecycle: open → submitNMSE → close → updateScore (batched) → finalize
 *         - Minimal on-chain state (fixed-point NMSE, per-round reputation)
 *         - Oracle-gated metric ingestion with TTL/freshness
 *         - Aggregator-gated, batched reputation commits
 *
 * Dependencies: OpenZeppelin AccessControl, ReentrancyGuard
 *   npm i -D @openzeppelin/contracts
 */

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SCO is AccessControl, ReentrancyGuard {
    // Roles
    bytes32 public constant AGGREGATOR_ROLE = keccak256("AGGREGATOR_ROLE");
    bytes32 public constant ORACLE_ROLE     = keccak256("ORACLE_ROLE");

    // Fixed-point scale for NMSE (10^6) and batch cap
    uint256 public constant SCALE = 1e6;
    uint256 public maxBatchSize = 250;

    // Optional allowlist contract (registration); zero address disables check
    address public registrationContract;

    // Round-scoped state
    struct Round {
        bool open;
        bool closed;
        bool finalized;
        bool scoresCommitted;
        uint8  selectPct;    // 1..100
        uint32 ttlSec;       // freshness window for submitNMSE
        bytes32 policyHash;  // binds to off-chain policy/config
    }

    mapping(uint32 => Round) public rounds;
    mapping(uint32 => mapping(address => uint256)) public nmseFixed;
    mapping(uint32 => mapping(address => bool))    public submitted;
    mapping(uint32 => mapping(address => uint256)) public reputation;

    // Events
    event RoundOpened(uint32 indexed roundId, uint8 selectPct, uint32 ttlSec, bytes32 policyHash);
    event RoundClosed(uint32 indexed roundId);
    event RoundFinalized(uint32 indexed roundId);
    event PerformanceSubmitted(address indexed client, uint32 indexed roundId, uint256 nmseFixed);
    event ReputationUpdated(uint32 indexed roundId, address indexed client, uint256 score);
    event RegistrationContractSet(address indexed registrationContract);
    event MaxBatchSizeSet(uint256 maxBatchSize);

    // Errors
    error ONLY_AGGREGATOR();
    error ONLY_ORACLE();
    error ROUND_ALREADY_CONFIGURED();
    error ROUND_NOT_OPEN();
    error ROUND_NOT_CLOSED();
    error ROUND_FINALIZED();
    error BAD_SELECT_PCT();
    error TTL_EXPIRED();
    error FUTURE_TIMESTAMP();
    error NOT_REGISTERED_CLIENT();
    error ALREADY_SUBMITTED();
    error ARRAY_LENGTH_MISMATCH();
    error EMPTY_ARRAY();
    error BATCH_TOO_LARGE();
    error SCORES_NOT_COMMITTED();

    modifier onlyAggregator() {
        if (!hasRole(AGGREGATOR_ROLE, _msgSender())) revert ONLY_AGGREGATOR();
        _;
    }
    modifier onlyOracle() {
        if (!hasRole(ORACLE_ROLE, _msgSender())) revert ONLY_ORACLE();
        _;
    }

    constructor(address admin, address aggregator, address oracle) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin == address(0) ? _msgSender() : admin);
        if (aggregator != address(0)) _grantRole(AGGREGATOR_ROLE, aggregator);
        if (oracle != address(0))     _grantRole(ORACLE_ROLE, oracle);
    }

    // --- Admin ---
    function setRegistrationContract(address reg) external onlyRole(DEFAULT_ADMIN_ROLE) {
        registrationContract = reg;
        emit RegistrationContractSet(reg);
    }
    function setMaxBatchSize(uint256 newMax) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newMax > 0 && newMax <= 10000, "bad-max");
        maxBatchSize = newMax;
        emit MaxBatchSizeSet(newMax);
    }
    function grantAggregator(address who) external onlyRole(DEFAULT_ADMIN_ROLE) { _grantRole(AGGREGATOR_ROLE, who); }
    function grantOracle(address who) external onlyRole(DEFAULT_ADMIN_ROLE) { _grantRole(ORACLE_ROLE, who); }

    // --- Lifecycle ---
    function openRound(uint32 roundId, bytes32 policyHash, uint8 selectPct, uint32 ttlSec) external onlyAggregator {
        Round storage r = rounds[roundId];
        if (r.open || r.closed || r.finalized) revert ROUND_ALREADY_CONFIGURED();
        if (selectPct == 0 || selectPct > 100) revert BAD_SELECT_PCT();
        r.open = true; r.closed = false; r.finalized = false; r.scoresCommitted = false;
        r.selectPct = selectPct; r.ttlSec = ttlSec; r.policyHash = policyHash;
        emit RoundOpened(roundId, selectPct, ttlSec, policyHash);
    }
    function closeRound(uint32 roundId) external onlyAggregator {
        Round storage r = rounds[roundId];
        if (!r.open || r.closed) revert ROUND_NOT_OPEN();
        r.open = false; r.closed = true;
        emit RoundClosed(roundId);
    }
    function finalizeRound(uint32 roundId) external onlyAggregator {
        Round storage r = rounds[roundId];
        if (!r.closed) revert ROUND_NOT_CLOSED();
        if (r.finalized) revert ROUND_FINALIZED();
        if (!r.scoresCommitted) revert SCORES_NOT_COMMITTED();
        r.finalized = true;
        emit RoundFinalized(roundId);
    }

    // --- Metrics (oracle-only) ---
    function submitNMSE(uint32 roundId, address client, uint256 nmse, uint256 ts)
        external onlyOracle nonReentrant
    {
        Round storage r = rounds[roundId];
        if (!r.open || r.closed) revert ROUND_NOT_OPEN();
        if (ts > block.timestamp) revert FUTURE_TIMESTAMP();
        if (r.ttlSec > 0 && block.timestamp - ts > r.ttlSec) revert TTL_EXPIRED();
        if (registrationContract != address(0) && !_isRegisteredClient(client)) revert NOT_REGISTERED_CLIENT();
        if (submitted[roundId][client]) revert ALREADY_SUBMITTED();
        nmseFixed[roundId][client] = nmse;
        submitted[roundId][client] = true;
        emit PerformanceSubmitted(client, roundId, nmse);
    }

    // --- Reputation (aggregator-only) ---
    function updateScore(uint32 roundId, address[] calldata clients, uint256[] calldata scores)
        external onlyAggregator nonReentrant
    {
        Round storage r = rounds[roundId];
        if (!r.closed || r.finalized) revert ROUND_NOT_CLOSED();
        uint256 n = clients.length;
        if (n == 0) revert EMPTY_ARRAY();
        if (n != scores.length) revert ARRAY_LENGTH_MISMATCH();
        if (n > maxBatchSize) revert BATCH_TOO_LARGE();
        unchecked {
            for (uint256 i = 0; i < n; i++) {
                reputation[roundId][clients[i]] = scores[i];
                emit ReputationUpdated(roundId, clients[i], scores[i]);
            }
        }
        r.scoresCommitted = true;
    }

    // --- Views ---
    function getRound(uint32 roundId) external view returns (
        bool open, bool closed, bool finalized, bool scoresCommitted, uint8 selectPct, uint32 ttlSec, bytes32 policyHash
    ) {
        Round storage r = rounds[roundId];
        return (r.open, r.closed, r.finalized, r.scoresCommitted, r.selectPct, r.ttlSec, r.policyHash);
    }
    function getNMSE(uint32 roundId, address client) external view returns (uint256) { return nmseFixed[roundId][client]; }
    function getReputation(uint32 roundId, address client) external view returns (uint256) { return reputation[roundId][client]; }

    // --- Registration probe (optional) ---
    function _isRegisteredClient(address client) internal view returns (bool) {
        address reg = registrationContract;
        if (reg == address(0)) return true;
        (bool ok, bytes memory data) = reg.staticcall(abi.encodeWithSignature("isClient(address)", client));
        if (ok && data.length >= 32) return abi.decode(data, (bool));
        (ok, data) = reg.staticcall(abi.encodeWithSignature("isRegisteredClient(address)", client));
        if (ok && data.length >= 32) return abi.decode(data, (bool));
        (ok, data) = reg.staticcall(abi.encodeWithSignature("isRegistered(address)", client));
        if (ok && data.length >= 32) return abi.decode(data, (bool));
        return false;
    }
}
