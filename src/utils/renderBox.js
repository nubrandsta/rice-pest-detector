import labels from "./labels.json";

/**
 * Render prediction boxes
 * @param {HTMLCanvasElement} canvasRef canvas tag reference
 * @param {Array} boxes_data boxes array
 * @param {Array} scores_data scores array
 * @param {Array} classes_data class array
 * @param {Array[Number]} ratios boxes ratio [xRatio, yRatio]
 */
export const renderBoxes = (canvasRef, boxes_data, scores_data, classes_data, ratios, originalImageElement) => {
  const ctx = canvasRef.getContext("2d");
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // clean canvas

  // Draw the original image first
  // In App.jsx, inputOutputCanvasRef (which is canvasRef here) is set to the natural dimensions of the image.
  // So, we draw the image directly onto this canvas without further scaling or offsetting here.
  if (originalImageElement && originalImageElement.src && originalImageElement.src !== '#' && originalImageElement.complete) {
    // Ensure canvas dimensions match the original image if they were somehow changed
    if (canvasRef.width !== originalImageElement.naturalWidth || canvasRef.height !== originalImageElement.naturalHeight) {
        canvasRef.width = originalImageElement.naturalWidth;
        canvasRef.height = originalImageElement.naturalHeight;
    }
    ctx.drawImage(originalImageElement, 0, 0, canvasRef.width, canvasRef.height);
  } else if (originalImageElement && (!originalImageElement.src || originalImageElement.src === '#')){
    // If no image is loaded, or it's the placeholder, keep canvas clear
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    return; // Do not draw boxes if no image
  }

  const colors = new Colors();

  // font configs
  const font = `${Math.max(
    Math.round(Math.max(ctx.canvas.width, ctx.canvas.height) / 40),
    14
  )}px Arial`;
  ctx.font = font;
  ctx.textBaseline = "top";

  for (let i = 0; i < scores_data.length; ++i) {
    // filter based on class threshold
    const klass = labels[classes_data[i]];
    const color = colors.get(classes_data[i]);
    const score = (scores_data[i] * 100).toFixed(1);

    
    let [y1_orig, x1_orig, y2_orig, x2_orig] = boxes_data.slice(i * 4, (i + 1) * 4);

    // The `canvasRef` for detection now has the dimensions of the original image.
    // The original image is drawn at (0,0) on this canvas, filling it.
    // The `ratios` from `preprocess` are: 
    //   ratios[0] = model_input_width / original_image_width
    //   ratios[1] = model_input_height / original_image_height
    // `boxes_data` (x1_orig, y1_orig, etc.) are coordinates relative to the model's input tensor dimensions.
    // To get coordinates on the original image (which is now the canvas itself):
    //   x_on_original_image = x1_orig / ratios[0]
    //   y_on_original_image = y1_orig / ratios[1]

    // Ensure the ratios are calculated correctly in preprocess
    // The ratios should be model_input_dimension / original_image_dimension
    // If the ratios are incorrect, adjust them here
    
    // Adjust the scaling logic if necessary
    // Verify ratios calculation from preprocess
    // Ratios should be [modelWidth/originalWidth, modelHeight/originalHeight]
    // Revert to division-based scaling
    const x1 = x1_orig * ratios[1];
    const y1 = y1_orig * ratios[0];
    const x2 = x2_orig * ratios[1];
    const y2 = y2_orig * ratios[0];
    
    // Remove multiplication approach
    // const x1 = x1_orig * ratios[0];
    // const y1 = y1_orig * ratios[1];
    // const x2 = x2_orig * ratios[0];
    // const y2 = y2_orig * ratios[1];

    const width = x2 - x1;
    const height = y2 - y1;

    // draw box.
    ctx.fillStyle = Colors.hexToRgba(color, 0.2);
    ctx.fillRect(x1, y1, width, height);

    // draw border box.
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(Math.min(ctx.canvas.width, ctx.canvas.height) / 200, 2.5);
    ctx.strokeRect(x1, y1, width, height);

    // Draw the label background.
    ctx.fillStyle = color;
    const textWidth = ctx.measureText(klass + " - " + score + "%").width;
    const textHeight = parseInt(font, 10); // base 10
    const yText = y1 - (textHeight + ctx.lineWidth);
    ctx.fillRect(
      x1 - 1,
      yText < 0 ? 0 : yText, // handle overflow label box
      textWidth + ctx.lineWidth,
      textHeight + ctx.lineWidth
    );

    // Draw labels
    ctx.fillStyle = "#ffffff";
    ctx.fillText(klass + " - " + score + "%", x1 - 1, yText < 0 ? 0 : yText);
  }
};

class Colors {
  // ultralytics color palette https://ultralytics.com/
  constructor() {
    this.palette = [
      "#FF3838",
      "#FF9D97",
      "#FF701F",
      "#FFB21D",
      "#CFD231",
      "#48F90A",
      "#92CC17",
      "#3DDB86",
      "#1A9334",
      "#00D4BB",
      "#2C99A8",
      "#00C2FF",
      "#344593",
      "#6473FF",
      "#0018EC",
      "#8438FF",
      "#520085",
      "#CB38FF",
      "#FF95C8",
      "#FF37C7",
    ];
    this.n = this.palette.length;
  }

  get = (i) => this.palette[Math.floor(i) % this.n];

  static hexToRgba = (hex, alpha) => {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `rgba(${[parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)].join(
          ", "
        )}, ${alpha})`
      : null;
  };
}
