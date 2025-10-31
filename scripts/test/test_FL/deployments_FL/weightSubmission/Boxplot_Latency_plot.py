import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load the CSV file into a DataFrame
data = pd.read_csv('/home/fjaved/demos/hardhat-polygon/test/test_FL/weightSubmission/weightsSubmission_50x1_log_updated.csv')

# Get the unique user indices
unique_users = sorted(data['User Index'].unique())

# Define a color palette
palette = sns.color_palette("husl", len(unique_users))

# Create a 5x10 subplot
fig, axes = plt.subplots(5, 10, figsize=(17, 10), sharey=True)

# Flatten the axes array for easy iteration
axes = axes.flatten()

# Plot a boxplot for each user in the respective subplot
for i, user in enumerate(unique_users):
    user_data = data[data['User Index'] == user]
    sns.boxplot(ax=axes[i], x=user_data['User Index'], y=user_data['Latency (s)'], 
                color=palette[i], width=0.1)
    if user == 50:  # Check if it's the last user
        # Position the legend at the lower right for the 50th user
        axes[i].legend([f'$AE_i =$ {user}'], bbox_to_anchor=(1, 0), loc='lower right', fontsize=8)
    else:
        # For all other users, keep the legend at the upper right
        axes[i].legend([f'$AE_i =$ {user}'], bbox_to_anchor=(0.99, 0.95), fontsize=8)
    axes[i].set_xlabel('')  # Remove the x-label
    axes[i].set_xticks([])  # Remove the x-ticks
    axes[i].set_ylabel('Latency (s)')  # Remove the y-label

# Adjust the layout
plt.tight_layout(rect=[0.03, 0.03, 1, 0.95])

# Save the plot as a PNG file
plt.savefig('/home/fjaved/demos/hardhat-polygon/test/test_FL/weightSubmission/boxplot_weightssubmission_latency.png')
plt.savefig('/home/fjaved/demos/hardhat-polygon/test/test_FL/weightSubmission/boxplot_weightssubmission_latency.svg')
