/* eslint-disable import/extensions */
import { renderSingleDonut as singleDonut } from "./single-donut.js";
import { renderHeatTimeline as heatTimeline } from "./heat-timeline.js";
import * as waterfallTimeline from "./waterfall-timeline.js";

const LimeExtensionChartRender = {
  singleDonut,
  heatTimeline,
  waterfallTimeline,
};

export default LimeExtensionChartRender;
