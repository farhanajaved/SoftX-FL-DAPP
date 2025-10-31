import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Load the CSV file into a DataFrame
data = pd.read_csv('/home/fjaved/demos/hardhat-polygon/test/test_FL/registration__seq_50x10_log.csv')

# Define the range of user indices (from 1 to 50)
all_user_indices = range(1, 51)

# Filter data to include only user indices from 1 to 50
filtered_data = data[data['User Index'].isin(all_user_indices)]

# Combine all latency values from the filtered users
all_latency_values = filtered_data['Latency (s)'].values

# Sort and calculate the CDF
sorted_latency = np.sort(all_latency_values)
cdf_values = np.arange(1, len(sorted_latency) + 1) / len(sorted_latency)

# Create the plot
plt.figure(figsize=(6, 5))
plt.step(sorted_latency, cdf_values, where="post", label="")
plt.xlabel('Latency (s)')
plt.ylabel('CDF')
plt.title('')

# Add mean, median, 95th percentile lines
mean_val = np.mean(sorted_latency)
median_val = np.median(sorted_latency)
percentile_95_val = np.percentile(sorted_latency, 95)

plt.axvline(mean_val, color='red', linestyle='--', linewidth=1, label='Mean')
plt.axvline(median_val, color='green', linestyle=':', linewidth=1, label='Median')
plt.axvline(percentile_95_val, color='blue', linestyle='-.', linewidth=1, label='95th Percentile')

plt.legend()

# Adjust the layout and save the plots
plt.tight_layout(rect=[0.03, 0.03, 1, 0.95])
plt.savefig('/home/fjaved/demos/hardhat-polygon/test/test_FL/Plots_FL/registeration/cdf_registration_time_all_users.png')
plt.savefig('/home/fjaved/demos/hardhat-polygon/test/test_FL/Plots_FL/registeration/cdf_registration_time_all_users.svg')
