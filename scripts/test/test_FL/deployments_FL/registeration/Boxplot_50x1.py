import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load the data
file_path = '/home/fjaved/demos/hardhat-polygon/test/test_FL/registration__seq_50x10_log.csv'
data = pd.read_csv(file_path)


# Create the boxplot with specified colors and widths
plt.figure(figsize=(6, 5))
sns.boxplot(data['Latency (s)'], linecolor="gray", linewidth=.75, widths=0.2,width=0.2)
plt.ylabel('Latency (s)')
plt.xlabel('$AE_n$ = 50')



plt.savefig('/home/fjaved/demos/hardhat-polygon/test/test_FL/Plots_FL/registeration/boxplot_aggregated.png')
plt.savefig('/home/fjaved/demos/hardhat-polygon/test/test_FL/Plots_FL/registeration/boxplot_aggregated.svg')


# Show the plot
# plt.show()
