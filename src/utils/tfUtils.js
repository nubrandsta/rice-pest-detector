import * as tf from "@tensorflow/tfjs";

/**
 * Loads a TensorFlow.js graph model and warms it up.
 * @param {string} modelUrl The URL to the model.json file.
 * @param {Function} onProgress A callback function to report loading progress.
 * @returns {Promise<tf.GraphModel>} A promise that resolves with the loaded and warmed-up model.
 */
export const loadAndWarmUpModel = async (modelUrl, onProgress) => {
  const model = await tf.loadGraphModel(modelUrl, {
    onProgress: onProgress, // Pass the onProgress callback to loadGraphModel
  });

  // Warmup the model
  // Ensure the model has inputs and the first input has a shape
  if (model.inputs && model.inputs.length > 0 && model.inputs[0].shape) {
    const inputShape = model.inputs[0].shape;
    // Create a dummy input tensor. Adjust if your model expects a different shape or dtype.
    const dummyInput = tf.tidy(() => tf.randomNormal(inputShape));
    await model.executeAsync(dummyInput); // Asynchronously execute with the dummy input
    tf.dispose(dummyInput); // Dispose of the dummy input tensor to free memory
  } else {
    console.warn("Model inputs are not defined or shape is missing, skipping warmup.");
  }

  return model;
};