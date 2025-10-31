// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/Chainlink.sol";

contract WeightSubmission is ChainlinkClient {
    using Chainlink for Chainlink.Request;

    // Constants for Chainlink
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    // Reference to the Reputation System
    ReputationSystem public reputationSystem;

    // Maximum number of rounds
    uint8 public constant maxRounds = 50;

    // Mapping to store the weights with client addresses for each round
    mapping(uint8 => mapping(address => uint256)) public roundWeights;

    // Array to store addresses that submitted weights in a round
    mapping(uint8 => address[]) public roundClients;

    // Mapping to track if a client has submitted for a round
    mapping(uint8 => mapping(address => bool)) public hasSubmitted;

    // Event to log weight submissions
    event WeightSubmitted(address indexed client, uint256 weight, uint8 round);

    // Constructor
    constructor(address _reputationSystem, address _oracle, bytes32 _jobId, uint256 _fee) {
        setPublicChainlinkToken();
        reputationSystem = ReputationSystem(_reputationSystem);
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;
    }

    // Function to submit weight for a specific round
    function submitWeight(uint8 _round, uint256 _weight) public {
        require(_round > 0 && _round <= maxRounds, "Round out of range");

        if (!hasSubmitted[_round][msg.sender]) {
            roundClients[_round].push(msg.sender);
            hasSubmitted[_round][msg.sender] = true;
        }

        roundWeights[_round][msg.sender] = _weight;
        emit WeightSubmitted(msg.sender, _weight, _round);
    }

    // Chainlink function to request data
    function requestWeightData(uint8 _round, string memory url, string memory path) public returns (bytes32 requestId) {
        Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);
        request.add("get", url);  // Set the URL to the API endpoint
        request.add("path", path); // Set the path to find the desired data in the API response
        requestId = sendChainlinkRequestTo(oracle, request, fee);

        // Additional logic to handle rounds and storing requests
    }

    // Callback function for Chainlink
    function fulfill(bytes32 _requestId, uint256 _weight) public recordChainlinkFulfillment(_requestId) {
        // Logic to assign this weight to a client for a round
        // You need additional data to know which round and client this response belongs to
    }
}
