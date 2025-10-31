import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load the CSV file into a DataFrame
data = pd.read_csv('/home/fjaved/demos/hardhat-polygon/test/test_FL/weightSubmission/weightsSubmission_50x1_log_updated.csv')

# Get the unique user indices
unique_users = sorted(data['User Index'].unique())

# Define a color palette
palette = sns.color_palette("husl", len(data['User Index'].unique()))

# Create a larger figure to handle the density of boxplots
plt.figure(figsize=(14, 8))

# Create a boxplot where each group corresponds to a different user
sns.boxplot(data=data, x='User Index', y='Latency (s)', palette=palette)

# Enhance plot details
plt.xlabel('$AE_i$ = 1 to 50')
plt.ylabel('Latency (s)')

# Adjust the layout
plt.tight_layout(rect=[0.03, 0.03, 1, 0.95])

# Save the plot as a PNG file
plt.savefig('/home/fjaved/demos/hardhat-polygon/test/test_FL/weightSubmission/boxplot_grouped_weightssubmission_latency.png')
plt.savefig('/home/fjaved/demos/hardhat-polygon/test/test_FL/weightSubmission/boxplot_grouped_weightssubmission_latency.svg')
