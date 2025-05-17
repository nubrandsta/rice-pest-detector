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
  if (originalImageElement && originalImageElement.src && originalImageElement.src !== '#' && originalImageElement.complete) {
    // Scale the canvas to the model input size, then draw the image, then draw boxes
    // This ensures box coordinates match the scaled image
    const modelWidth = canvasRef.width;
    const modelHeight = canvasRef.height;
    
    // Calculate the aspect ratio of the image and canvas
    const imageAspectRatio = originalImageElement.naturalWidth / originalImageElement.naturalHeight;
    const canvasAspectRatio = modelWidth / modelHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imageAspectRatio > canvasAspectRatio) {
      // Image is wider than canvas
      drawWidth = modelWidth;
      drawHeight = modelWidth / imageAspectRatio;
      offsetX = 0;
      offsetY = (modelHeight - drawHeight) / 2;
    } else {
      // Image is taller than or same aspect ratio as canvas
      drawHeight = modelHeight;
      drawWidth = modelHeight * imageAspectRatio;
      offsetY = 0;
      offsetX = (modelWidth - drawWidth) / 2;
    }
    
    ctx.drawImage(originalImageElement, offsetX, offsetY, drawWidth, drawHeight);
  } else if (originalImageElement && (!originalImageElement.src || originalImageElement.src === '#')){
    // If no image is loaded, or it's the placeholder, keep canvas clear or show a message
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // Optionally, display a message
    // ctx.fillStyle = "gray";
    // ctx.font = "16px Arial";
    // ctx.textAlign = "center";
    // ctx.fillText("Tidak ada gambar yang dimuat", canvasRef.width / 2, canvasRef.height / 2);
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

    // Get the dimensions and offset of the drawn image on the canvas
    const modelWidth = canvasRef.width;
    const modelHeight = canvasRef.height;
    const imageAspectRatio = originalImageElement.naturalWidth / originalImageElement.naturalHeight;
    const canvasAspectRatio = modelWidth / modelHeight;
    let drawWidth, drawHeight, offsetX, offsetY;

    if (imageAspectRatio > canvasAspectRatio) {
      drawWidth = modelWidth;
      drawHeight = modelWidth / imageAspectRatio;
      offsetX = 0;
      offsetY = (modelHeight - drawHeight) / 2;
    } else {
      drawHeight = modelHeight;
      drawWidth = modelHeight * imageAspectRatio;
      offsetY = 0;
      offsetX = (modelWidth - drawWidth) / 2;
    }

    // The model's output coordinates (x1_orig, y1_orig, etc.) are relative to the model's input tensor dimensions
    // The model's output coordinates (x1_orig, y1_orig, etc.) are relative to the model's input tensor dimensions
    // (canvasRef.width, canvasRef.height). This input tensor was created by padding the original image to a square
    // and then resizing that square to the model's input dimensions.
    // The 'ratios' array contains [xRatio, yRatio], where:
    // xRatio = model_input_width / original_image_width (after padding to square if necessary, before final resize to model input)
    // yRatio = model_input_height / original_image_height (similarly)
    // More accurately, from preprocess:
    // const xRatio = modelWidth / w; // w is original width, modelWidth is 640 for yolov8
    // const yRatio = modelHeight / h; // h is original height, modelHeight is 640 for yolov8
    // These ratios are for scaling from original image to the *padded square input* that was then resized to model dims.
    // The boxes_data are already scaled to the model input dimensions (e.g., 0-640).

    // We need to map these coordinates to the 'drawWidth' x 'drawHeight' area on the canvas 
    // where the original, unpadded image is drawn, considering its 'offsetX' and 'offsetY'.

    // x1_orig is a coordinate on the model input (e.g., 0 to 640).
    // We need to scale it back to the original image's coordinate system first, then to the canvas's drawn image.
    // Original coordinate on padded image = x1_orig / xRatio (if xRatio was model_dim / original_dim)
    // But ratios are actually: xRatio = model_input_width / original_image_width_before_padding_but_after_aspect_fit_to_square
    // And yRatio = model_input_height / original_image_height_before_padding_but_after_aspect_fit_to_square
    // The `boxes_data` are already in the coordinate system of the model input (e.g. 0-640 for a 640x640 model).
    // The `ratios` are [x_scale_factor_for_padded_input, y_scale_factor_for_padded_input]
    // x_scale_factor_for_padded_input = model_input_width / padded_image_width
    // y_scale_factor_for_padded_input = model_input_height / padded_image_height
    // The `preprocess` function in `detect.js` calculates ratios as `modelWidth / w` and `modelHeight / h`
    // where w and h are dimensions of the *original* image, and modelWidth/Height are the target square dimensions (e.g. 640x640)
    // So, x1_orig / ratios[0] would give coordinate on original image width.

    const x1_on_original = x1_orig / ratios[0];
    const y1_on_original = y1_orig / ratios[1];
    const x2_on_original = x2_orig / ratios[0];
    const y2_on_original = y2_orig / ratios[1];

    // Now scale these original image coordinates to the canvas's drawn image dimensions and add offset.
    // scaleX_canvas = drawWidth / originalImageElement.naturalWidth;
    // scaleY_canvas = drawHeight / originalImageElement.naturalHeight;

    const x1 = offsetX + x1_on_original * (drawWidth / originalImageElement.naturalWidth);
    const y1 = offsetY + y1_on_original * (drawHeight / originalImageElement.naturalHeight);
    const x2 = offsetX + x2_on_original * (drawWidth / originalImageElement.naturalWidth);
    const y2 = offsetY + y2_on_original * (drawHeight / originalImageElement.naturalHeight);

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
