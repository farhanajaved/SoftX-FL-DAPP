import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from matplotlib.lines import Line2D

# Load the CSV file into a DataFrame
data = pd.read_csv('/home/fjaved/demos/hardhat-polygon/test/test_FL/weightSubmission/weightsSubmission_50x1_log_updated.csv')

# Selected users
selected_users = [1, 10, 20, 30, 40, 50]

# Define a color palette for the selected users based on the number of unique users
palette = sns.color_palette("husl", len(data['User Index'].unique()))

# Create a 2x3 subplot grid
fig, axes = plt.subplots(2, 3, figsize=(7.5, 4), sharey=True)

# Flatten the axes array for easy iteration
axes = axes.flatten()

# Plotting Violin plots for each user
for i, user in enumerate(selected_users):
    user_data = data[data['User Index'] == user]
    
    # Plotting on specific subplot
    ax = axes[i]
    sns.violinplot(y=user_data['Latency (s)'], ax=ax, color=palette[user - 1], inner='box', linewidth=1, width= 0.2)
    ax.set_xlabel('')
    ax.set_ylabel('Latency (s)')
    
    # Add text label inside the plot
    #ax.text(0.5, 0.95, f"$AE_i$ = {user}", color=palette[user - 1], transform=ax.transAxes, fontsize=8, verticalalignment='top', horizontalalignment='center', bbox=dict(facecolor='white', alpha=0.2))

    # Create a custom legend with a 2D line
    custom_lines = [Line2D([0], [0], color=palette[user - 1], lw=2)]
    ax.legend(custom_lines, [f"$AE_i$ = {user}"], loc='upper left', fontsize=8)

# Set common labels
fig.text(0.5, 0.01, '', ha='center', va='center')
fig.text(0.01, 0.5, '', ha='center', va='center', rotation='vertical')

# Adjust the layout and save the plots
plt.tight_layout(rect=[0.03, 0.03, 1, 0.95])
plt.savefig('/home/fjaved/demos/hardhat-polygon/test/test_FL/weightSubmission/violin_weightSubmission.png')
plt.savefig('/home/fjaved/demos/hardhat-polygon/test/test_FL/weightSubmission/violin_weightSUbmission.svg')

