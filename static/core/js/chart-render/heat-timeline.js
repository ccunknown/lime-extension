const defaultOptions = {
  width: 400,
  height: 30,
  margin: { top: 0, right: 10, bottom: 20, left: 10 },
  key: {
    size: `1.5rem`,
    dy: `-0.5rem`,
  },
  value: {
    size: `1.5rem`,
    dy: `1.5rem`,
    format: d3.format(`.2f`),
  },
  defaultDisplay: 0,
  animate: {
    pieDelay: 200,
    pieDuration: 1500,
    hoverEffectDuration: 100,
    textDelay: 1500,
    textDuration: 500,
  },
};

/*
  data = [
    {
      name?: name,
      start: unixTimeStamp,
      end: unixTimeStamp,
    }
  ]
  options? = {
    defaultDisplay: `key1`,
    unit: `%`,
    format: `.2f`,
    width: `150px`,
    colors: [`#FFFFFF`, `#000000`],
  }
*/

function renderHeatTimeline(domId, dataArr, opt) {
  const id = domId.replace(/^#/i, ``);
  const options = Object.assign(defaultOptions, opt);

  console.log(`renderHeatTimeline(id: ${id})`);
  console.log(`data:`, dataArr);
  console.log(`options:`, options);

  const xAccessor = (d) => d.start;
  const yAccessor = () => 1;
  // const yAccessor = (d) => d.end - d.start;

  d3.select(`#${id}`).selectAll(`*`).remove();

  const wrapper = d3
    .select(`#${id}`)
    .append(`svg`)
    .attr(`viewBox`, `0 0 ${options.width} ${options.height}`);

  const bounds = wrapper.append(`g`);

  // Set scale
  const chartStartsAt = Math.min(
    ...dataArr.filter((e) => e.start).map((e) => e.start)
  );
  const chartEndsAt = Math.max(
    ...dataArr.filter((e) => e.end).map((e) => e.end)
  );
  console.log(`chartStartsAt:`, chartStartsAt);
  console.log(`chartEndsAt:`, chartEndsAt);
  const xScale = d3.scaleTime()
    .domain([chartStartsAt, chartEndsAt])
    .range([options.margin.left, options.width - options.margin.right]);
  console.log(`xScale:`, xScale);
  const yScale = d3.scaleLinear()
    .domain(d3.extent(dataArr, yAccessor))
    .range([options.height - options.margin.bottom, 0]);

  // Prepare data
  const timeBoxGenerator = d3.area()
    // .x((d) => xScale(xAccessor(d)))
    // .x((d) => xScale(d.start))
    .x0((d) => xScale(d.start))
    .x1((d) => xScale(d.end))
    .y0(options.height - options.margin.bottom)
    .y1((d) => yScale(yAccessor(d)))
    .curve(d3.curveStepAfter);

  const div = d3.select("#timeline").append("div")
    .attr(`class`, `tooltip`)
    .style(`opacity`, 0.7)
    .style(`visibility`, `hidden`);
  const timeScale = d3.scaleTime()
    // .domain([new Date(chartStartsAt * 1000), new Date(chartEndsAt * 1000)])
    .domain([new Date(chartStartsAt), new Date(chartEndsAt)])
    .range([options.margin.left, options.width - options.margin.right]);

  bounds
    .append(`g`)
    .attr(
      `transform`,
      `translate(0, ${options.height - options.margin.bottom})`
    )
    .style(`font-size`, `0.8rem`)
    .style(`font-weight`, `bold`)
    .style(`color`, `#343a40`)
    .call(d3.axisBottom(timeScale));

  // Draw data
  // bounds
  //   .append(`path`)
  //   .attr(`d`, timeBoxGenerator(dataArr))
  //   .attr(`fill`, `#3CC692`);
  bounds
    .selectAll(`foo`)
    .data(dataArr)
    .enter()
    .append(`rect`)
    .attr(`x`, (d) => xScale(d.start))
    // .attr(`y`, () => options.height - options.margin.bottom)
    .attr(`y`, () => options.margin.top)
    .attr(`width`, (d, i) => {
      const w = xScale(d.end) - xScale(d.start);
      if (Number.isNaN(w)) console.log(`i[${i}]:`, d);
      // console.log(`rect width:`, w);
      return w;
    })
    .attr(`height`, () => yScale(1))
    .attr(`fill`, `#3CC692`);
}

export default renderHeatTimeline;
export { renderHeatTimeline };
