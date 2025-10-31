import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

# Load the data from the uploaded CSV file
file_path = '/home/fjaved/demos/hardhat-polygon/test/reputationscore/reputtaion_test.csv'
data = pd.read_csv(file_path)

# Color for the plots
color = '#FCB07E'

# Histogram for Latency values
plt.figure(figsize=(10, 6))
sns.histplot(data['Latency (seconds)'], kde=True, color=color)
plt.title('')
plt.xlabel('Latency (seconds)')
plt.ylabel('Frequency')
plt.savefig('/home/fjaved/demos/hardhat-polygon/test/reputationscore/Histogram_write.png')
plt.savefig('/home/fjaved/demos/hardhat-polygon/test/reputationscore/Histogram_write.svg')

plt.close()

# Box plot for all Latency values
plt.figure(figsize=(6, 5))
sns.boxplot(y='Latency (seconds)', data=data, color=color, width=0.1)
plt.title('')
plt.ylabel('Latency (seconds)')
plt.savefig('/home/fjaved/demos/hardhat-polygon/test/reputationscore/box_write.png')
plt.savefig('/home/fjaved/demos/hardhat-polygon/test/reputationscore/box_write.svg')


# Box plot for all Latency values
# Box plot for all Latency values
# Assuming each 50 measurements are a round, and your measurements are in a column named 'Latency (seconds)'
# We'll create an index that represents each round
rounds = data.groupby(data.index // 50)['Latency (seconds)'].mean()  # This groups every 50 rows and calculates their mean

# Plotting the boxplot for these round averages
plt.figure(figsize=(10, 8))
sns.boxplot(y=rounds, color='skyblue')  # You can customize color and other properties
plt.title('Average Latency per Round')
plt.ylabel('Average Latency (seconds)')

plt.savefig('/home/fjaved/demos/hardhat-polygon/test/reputationscore/box_write2.png')
plt.savefig('/home/fjaved/demos/hardhat-polygon/test/reputationscore/box_write2.svg')

plt.close()



# CDF plot for Latency values from rounds 2 to 50 for all 50 clients, excluding zero values
latency_values = data[data['Round Number'].between(2, 50)]['Latency (seconds)'].dropna()
latency_values = latency_values[latency_values > 0]

# Calculate the CDF
sorted_latency = np.sort(latency_values)
cdf = np.arange(1, len(sorted_latency) + 1) / len(sorted_latency)

plt.figure(figsize=(6, 5))
plt.plot(sorted_latency, cdf, drawstyle='steps-post', marker='.', color=color)

# Add mean, median, 95th percentile lines
mean_val = np.mean(latency_values)
median_val = np.median(latency_values)
percentile_95_val = np.percentile(latency_values, 95)

plt.axvline(mean_val, color='red', linestyle='--', linewidth=1, label='Mean')
plt.axvline(median_val, color='green', linestyle=':', linewidth=1, label='Median')
plt.axvline(percentile_95_val, color='blue', linestyle='-.', linewidth=1, label='95th Percentile')

# Update the legend to show new lines
plt.legend(loc='upper left', fontsize=8)  # Adjust the fontsize here

# Set labels
plt.title('')
plt.xlabel('Latency (seconds)')
plt.ylabel('CDF')
plt.savefig('/home/fjaved/demos/hardhat-polygon/test/reputationscore/cdf_write.png')
plt.savefig('/home/fjaved/demos/hardhat-polygon/test/reputationscore/cdf_write.svg')
plt.close()
