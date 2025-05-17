import * as tf from "@tensorflow/tfjs";
import labels from "./labels.json";
import { renderBoxes } from "./renderBox";

const numClass = labels.length;

/**
 * Preprocess image / frame before forwarded into the model
 * @param {HTMLVideoElement|HTMLImageElement} source
 * @param {Number} modelWidth
 * @param {Number} modelHeight
 * @returns input tensor, xRatio and yRatio
 */
const preprocess = (source, modelWidth, modelHeight) => {
  let xScale, yScale, padLeft, padTop, inputW, inputH;

  const img = tf.browser.fromPixels(source);
  const [h, w] = img.shape.slice(0, 2);
  const maxSize = Math.max(w, h);

  // Calculate padding
  padTop = 0;
  padLeft = 0;
  if (h < maxSize) padTop = maxSize - h;
  if (w < maxSize) padLeft = maxSize - w;

  // Pad to square
  const imgPadded = img.pad([
    [0, maxSize - h], // bottom
    [0, maxSize - w], // right
    [0, 0],
  ]);

  // Scale from padded square to model input
  xScale = w / maxSize;
  yScale = h / maxSize;
  inputW = w;
  inputH = h;

  const input = tf.image
    .resizeBilinear(imgPadded, [modelWidth, modelHeight])
    .div(255.0)
    .expandDims(0);

  return [input, {xScale, yScale, padLeft, padTop, inputW, inputH, modelWidth, modelHeight, maxSize}];
};

/**
 * Function run inference and do detection from source.
 * @param {HTMLImageElement|HTMLVideoElement} source
 * @param {tf.GraphModel} model loaded YOLOv8 tensorflow.js model
 * @param {HTMLCanvasElement} canvasRef canvas reference
 * @param {VoidFunction} callback function to run after detection process
 */
export const detect = async (source, model, canvasRef, callback = () => {}) => {
  const [modelWidth, modelHeight] = model.inputShape.slice(1, 3); // get model width and height

  tf.engine().startScope(); // start scoping tf engine
  const [input, scaleInfo] = preprocess(source, modelWidth, modelHeight); // preprocess image

  const res = model.net.execute(input); // inference model
  const transRes = res.transpose([0, 2, 1]); // transpose result [b, det, n] => [b, n, det]
  const boxes = tf.tidy(() => {
    const w = transRes.slice([0, 0, 2], [-1, -1, 1]); // get width
    const h = transRes.slice([0, 0, 3], [-1, -1, 1]); // get height
    const x1 = tf.sub(transRes.slice([0, 0, 0], [-1, -1, 1]), tf.div(w, 2)); // x1
    const y1 = tf.sub(transRes.slice([0, 0, 1], [-1, -1, 1]), tf.div(h, 2)); // y1
    return tf
      .concat(
        [
          y1,
          x1,
          tf.add(y1, h), //y2
          tf.add(x1, w), //x2
        ],
        2
      )
      .squeeze();
  }); // process boxes [y1, x1, y2, x2]

  const [scores, classes] = tf.tidy(() => {
    // class scores
    const rawScores = transRes.slice([0, 0, 4], [-1, -1, numClass]).squeeze(0); // #6 only squeeze axis 0 to handle only 1 class models
    return [rawScores.max(1), rawScores.argMax(1)];
  }); // get max scores and classes index

  const nms = await tf.image.nonMaxSuppressionAsync(boxes, scores, 500, 0.45, 0.2); // NMS to filter boxes

  const boxes_data = boxes.gather(nms, 0).dataSync(); // indexing boxes by nms index
  const scores_data = scores.gather(nms, 0).dataSync(); // indexing scores by nms index
  const classes_data = classes.gather(nms, 0).dataSync(); // indexing classes by nms index

  renderBoxes(canvasRef, boxes_data, scores_data, classes_data, scaleInfo, source); // render boxes
  tf.dispose([res, transRes, boxes, scores, classes, nms]); // clear memory

  // Call the callback with loading state set to false
  callback({ loading: false, progress: 1 });

  tf.engine().endScope(); // end of scoping
};

/**
 * Function to detect video from every source.
 * @param {HTMLVideoElement} vidSource video source
 * @param {tf.GraphModel} model loaded YOLOv8 tensorflow.js model
 * @param {HTMLCanvasElement} canvasRef canvas reference
 */
export const detectVideo = (vidSource, model, canvasRef) => {
  /**
   * Function to detect every frame from video
   */
  const detectFrame = async () => {
    if (vidSource.videoWidth === 0 && vidSource.srcObject === null) {
      const ctx = canvasRef.getContext("2d");
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // clean canvas
      return; // handle if source is closed
    }

    detect(vidSource, model, canvasRef, () => {
      requestAnimationFrame(detectFrame); // get another frame
    });
  };

  detectFrame(); // initialize to detect every frame
};
