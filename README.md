# Quantitative Simulation of Radiotracer Dynamics and Dosimetric Effects in Tumor Microenvironments

## Overview
This simulator models how a radioactive drug (tracer) is absorbed by both **tumor tissue** and **healthy tissue** in a simplified 2D slice of the body. It visualizes how the drug accumulates, decays, and treats the tumor over time, while also showing potential damage to healthy tissue.

---

## How It Works

### 1. Simulation Model
- The tissue slice is represented as a grid of tiny “voxels” (like pixels), mostly healthy tissue, with a small circular region as tumor.
- Each voxel tracks the amount of radioactive tracer it contains.
- The tracer’s behavior is governed by:
  - **Uptake rate (k_in):** How fast tissue absorbs the tracer.
  - **Washout rate (k_out):** How fast the tracer leaves the tissue.
  - **Radioactive decay:** The tracer loses activity over time based on its half-life.
- A **plasma input function** models the injection of tracer into the bloodstream as a quick bolus that fades exponentially.

### 2. Treatment Effect
- The simulator models treatment by reducing tumor activity faster with **higher doses**, simulating tumor cell kill.
- Healthy tissue also experiences some damage at higher doses, reflected by a decrease in healthy tissue activity.
- This creates a trade-off:  
  - **High dose:** Tumor dies quickly but healthy tissue is damaged.  
  - **Low dose:** Tumor takes longer to die but healthy tissue is spared.

### 3. Noise Simulation
- Detector noise is simulated by adding random “Poisson noise” to the tracer activity, mimicking real PET scanner uncertainty.
- Users can adjust noise level to see how image clarity changes.

---

## User Interface

### Heatmap Animation
- Shows a color-coded 2D slice of tissue over time.
- **Colors represent tracer activity:**  
  - Blue/green = low activity  
  - Yellow/red = high activity
- Tumor area “lights up” more than healthy tissue initially, then fades as tracer decays and treatment takes effect.

### Time–Activity Curves
- Line graphs display average tracer activity over time in:
  - Tumor tissue  
  - Healthy tissue
- Another graph shows estimated **tissue damage** over time for both tissue types.

### Interactive Controls
Users can adjust sliders to change:
- **Radiation Half-Life:** How quickly the drug loses power.
- **Tumor Uptake Rate:** How fast the tumor absorbs the drug.
- **Healthy Tissue Uptake Rate:** How fast normal tissue absorbs the drug.
- **Injected Dose:** Treatment strength — higher doses kill tumor faster but harm healthy tissue.
- **Noise Level:** Controls image clarity by simulating scanner noise.

Tooltips and simple labels explain each control in everyday language.

---

## What You Learn
- How radioactive tracers accumulate differently in tumor vs. healthy tissue.
- The balance doctors must strike between effective tumor treatment and protecting healthy tissue.
- Why PET scans work to detect tumors based on tracer uptake.
- How radioactive decay and detector noise affect image quality.

---

## How to Use

1. **Run the Python simulation script** to generate tracer activity data over time.
2. **Open the HTML page** in a web browser.
3. Use the **sliders** to adjust parameters and watch the heatmap and graphs update in real time.
4. Observe how changing the injected dose affects tumor kill and healthy tissue damage visually and numerically.
5. Explore the effects of half-life and noise on image quality and treatment dynamics.

---

## Technical Notes
- The simulation uses **first-order kinetic equations** to model tracer uptake and washout.
- Radioactive decay is modeled using the isotope’s half-life.
- Poisson noise simulates realistic detection variability.
- Heatmaps are drawn using HTML5 Canvas; graphs use Chart.js.
- The simulator is designed to be educational, not for clinical use.

---

## Conclusion
This tool helps visualize the complex interactions in nuclear medicine treatment — from tracer uptake to treatment effects — using an intuitive heatmap and graphs with simple controls. It provides an engaging way to understand how radioactive drugs work to detect and treat tumors while balancing safety for healthy tissue.

---

## License
[MIT License](LICENSE)

---

## Contact
Created by Elijah Jimenez @ Bioscience High School.  
For questions or suggestions, please open an issue or contact me at elijah.jimenez.bhs@gmail.com or for academic inquiries contact me at ejimenez8885@student.phoenixunion.org

