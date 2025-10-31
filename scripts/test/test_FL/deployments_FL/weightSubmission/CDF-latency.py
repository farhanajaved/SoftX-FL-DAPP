import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Load the CSV file into a DataFrame
data = pd.read_csv('/home/fjaved/demos/hardhat-polygon/test/test_FL/weightSubmission/weightsSubmission_50x1_log_updated.csv')

# Selected users
selected_users = [1, 10, 20, 30, 40, 50]

# Define a color palette for the selected users based on the number of unique users
palette = sns.color_palette("husl", len(data['User Index'].unique()))

# Create a 2x3 subplot grid
fig, axes = plt.subplots(2, 3, figsize=(10, 5), sharey=True, sharex=True)

# Flatten the axes array for easy iteration
axes = axes.flatten()

# Plotting CDFs for each user
for i, user in enumerate(selected_users):
    user_data = data[data['User Index'] == user]
    latency_values = np.sort(user_data['Latency (s)'].values)
    cdf_values = np.arange(1, len(latency_values) + 1) / len(latency_values)
    
    # Plotting on specific subplot
    ax = axes[i]
    ax.step(latency_values, cdf_values, where="post", label=f"$AE_i$ = {user}", color=palette[user - 1])
    ax.set_xlabel('')
    ax.set_ylabel('')

    # Add mean, median, 95th percentile lines
    mean_val = np.mean(latency_values)
    median_val = np.median(latency_values)
    percentile_95_val = np.percentile(latency_values, 95)

    ax.axvline(mean_val, color='red', linestyle='--', linewidth=1, label='Mean')
    ax.axvline(median_val, color='green', linestyle=':', linewidth=1, label='Median')
    ax.axvline(percentile_95_val, color='blue', linestyle='-.', linewidth=1, label='95th Percentile')

    # Check if it's the 50th user and adjust the legend accordingly
    if user == 50:
        ax.legend(loc='upper left', fontsize=8)
    else:
        ax.legend(loc='upper right', fontsize=8)

# Set common labels
fig.text(0.5, 0.01, 'Latency (s)', ha='center', va='center')
fig.text(0.01, 0.5, 'CDF', ha='center', va='center', rotation='vertical')

# Adjust the layout and save the plots
plt.tight_layout(rect=[0.03, 0.03, 1, 0.95])
plt.savefig('/home/fjaved/demos/hardhat-polygon/test/test_FL/weightSubmission/cdf_weightSubmission.png')
plt.savefig('/home/fjaved/demos/hardhat-polygon/test/test_FL/weightSubmission/cdf_weightSubmission.svg')
