# Radioactive Tracer Uptake Simulation
# Author: GitHub Copilot
# Simulates tracer uptake in a 2D tissue slice (healthy vs tumor)

import numpy as np
import json
import math

# Simulation parameters (can be adjusted)
GRID_SIZE = 50  # 50x50 voxels
tumor_radius = 8  # radius of tumor region (voxels)
tumor_center = (25, 25)  # center of tumor

# Kinetic parameters (default values)
k_in_healthy = 0.01  # 1/s
k_out_healthy = 0.02  # 1/s
k_in_tumor = 0.04  # 1/s
k_out_tumor = 0.005  # 1/s

half_life_min = 10  # minutes
half_life = half_life_min * 60  # seconds
lambda_decay = math.log(2) / half_life

injected_dose = 1000  # arbitrary units
noise_level = 0.05  # Poisson noise scaling

# Time parameters
t_max = 600  # seconds
dt = 1  # time step (s)
time_points = np.arange(0, t_max + dt, dt)

# Plasma input function: bolus injection with exponential decay
def plasma_input(t, dose=injected_dose, tau=60):
    return dose * np.exp(-t / tau)

# Assign tissue types
tissue_type = np.zeros((GRID_SIZE, GRID_SIZE), dtype=int)  # 0=healthy, 1=tumor
for i in range(GRID_SIZE):
    for j in range(GRID_SIZE):
        if (i - tumor_center[0]) ** 2 + (j - tumor_center[1]) ** 2 <= tumor_radius ** 2:
            tissue_type[i, j] = 1

# Initialize activity array: shape (time, x, y)
activity = np.zeros((len(time_points), GRID_SIZE, GRID_SIZE))

# Simulate tracer kinetics for each voxel
def simulate():
    for i in range(GRID_SIZE):
        for j in range(GRID_SIZE):
            if tissue_type[i, j] == 1:
                k_in = k_in_tumor
                k_out = k_out_tumor
            else:
                k_in = k_in_healthy
                k_out = k_out_healthy
            A = 0.0
            for t_idx, t in enumerate(time_points):
                Cp = plasma_input(t)
                dA = k_in * Cp - k_out * A - lambda_decay * A
                A += dA * dt
                # Add Poisson noise
                noisy_A = np.random.poisson(max(A, 0) * noise_level) / max(noise_level, 1e-6)
                activity[t_idx, i, j] = noisy_A

simulate()

# Save activity for each voxel at each time step
output = {
    "grid_size": GRID_SIZE,
    "time_points": time_points.tolist(),
    "activity": activity.tolist(),
    "tissue_type": tissue_type.tolist()
}
with open("activity_map.json", "w") as f:
    json.dump(output, f)

# Compute average activity for tumor and healthy tissue over time
tumor_mask = (tissue_type == 1)
healthy_mask = (tissue_type == 0)
avg_tumor = activity[:, tumor_mask].mean(axis=1)
avg_healthy = activity[:, healthy_mask].mean(axis=1)

avg_output = {
    "time_points": time_points.tolist(),
    "avg_tumor": avg_tumor.tolist(),
    "avg_healthy": avg_healthy.tolist()
}
with open("activity_curves.json", "w") as f:
    json.dump(avg_output, f)

print("Simulation complete. Output saved to activity_map.json and activity_curves.json.")
