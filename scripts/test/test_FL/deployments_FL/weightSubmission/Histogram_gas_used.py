import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from matplotlib.ticker import FuncFormatter

# Load the CSV file into a DataFrame
data = pd.read_csv('/home/fjaved/demos/hardhat-polygon/test/test_FL/weightSubmission/weightsSubmission_50x1_log_updated.csv')

# Extract unique gas used values
unique_gas_used = data['Gas Used'].unique()

# Define a custom formatter to convert float values into integers on x-axis
def custom_formatter(x, pos):
    return f"{int(x)}"

# Plot the normalized histogram using Seaborn
plt.figure(figsize=(8, 6))
sns.histplot(data['Gas Used'], bins=len(unique_gas_used), color='#3066BE', edgecolor='black', stat='percent')
plt.xlabel('Gas Used')
plt.ylabel('Percentage')
plt.xticks(unique_gas_used)  # Set x-ticks to be the unique gas used values

# Set the formatter for x-axis
ax = plt.gca()
ax.xaxis.set_major_formatter(FuncFormatter(custom_formatter))

# Adding a text box for total count
plt.text(
    0.80, 0.94,
    r'$AE_n = 50$'.format(len(data)),
    transform=plt.gca().transAxes,
    fontsize=11,
    bbox=dict(facecolor='white', alpha=0.2)
)

# Save the plot as a PNG file
plt.savefig('/home/fjaved/demos/hardhat-polygon/test/test_FL/weightSubmission/histogram_gas_used_weightSubmission.png')
plt.savefig('/home/fjaved/demos/hardhat-polygon/test/test_FL/weightSubmission/histogram_gas_used_weightSubmission.svg')

# Show the plot
plt.show()
