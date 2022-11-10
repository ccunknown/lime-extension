const defaultOptions = {
  width: 400,
  height: 35,
  margin: { top: 0, right: 10, bottom: 20, left: 10 },
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
    colors: [`#FFFFFF`, `#000000`],
  }
*/

function renderHeatTimeline(domId, dataArr, opt) {
  const id = domId.replace(/^#/i, ``);
  const divId = `${id}-div-${new Date().getTime()}`;
  const options = Object.assign(defaultOptions, opt);
  options.width = document.getElementById(`${id}`).offsetWidth;
  let data = dataArr;

  console.log(`renderHeatTimeline(id: ${id})`);
  console.log(`data:`, dataArr);
  console.log(`options:`, options);

  d3.select(`#${id}`).selectAll(`*`).remove();
  const outterDiv = d3.select(`#${id}`).append(`div`).attr(`id`, divId);

  const draw = () => {
    outterDiv.selectAll(`*`).remove();
    const svg = outterDiv
      .append(`svg`)
      .attr(`viewBox`, `0 0 ${options.width} ${options.height}`);

    // Set scale
    const chartStart = Math.min(...data.map((e) => e.start));
    const chartEnd = Math.max(...data.map((e) => e.end));
    // console.log(`chartStart:`, chartStart);
    // console.log(`chartEnd:`, chartEnd);
    let xScale = d3.scaleTime()
      .domain([chartStart, chartEnd])
      .range([options.margin.left, options.width - options.margin.right]);
    let xScale2 = xScale.copy();
    const yScale = d3.scaleLinear()
      .domain(d3.extent(dataArr, () => 1))
      .range([options.height - options.margin.bottom, 0]);

    // Prepare for tooltip
    const div = d3
      .select("#timeline")
      .append("div")
      .attr(`class`, `tooltip`)
      .style(`opacity`, 0.7)
      .style(`visibility`, `hidden`);

    // Time axis
    const timeAxis = svg
      .append(`g`)
      .attr(
        `transform`,
        `translate(0, ${options.height - options.margin.bottom})`
      )
      .style(`font-size`, `1rem`)
      .style(`font-weight`, `bold`)
      .style(`color`, `#343a40`);

    // Data drawer
    const dataAxis = svg.append(`g`);
    const drawRect = function() {
      dataAxis
        .selectAll()
        .data(data)
        .enter()
        .append(`rect`)
        .attr(`x`, (d) => xScale2(d.start))
        .attr(`y`, () => options.margin.top)
        .attr(`width`, (d, i) => {
          const w = xScale2(d.end) - xScale2(d.start);
          if (Number.isNaN(w)) console.log(`NaN i[${i}]:`, d);
          return w;
        })
        .attr(`height`, () => yScale(1))
        .attr(`fill`, `#3CC692`)
        .attr(`opacity`, 0.8);
    };

    const redraw = () => {
      timeAxis.call(d3.axisBottom(xScale2));
      dataAxis.selectAll(`*`).remove();
      drawRect();
    };

    const zoom = d3
      .zoom()
      .scaleExtent([1, 10000])
      .translateExtent([
        [xScale.range()[0], 0],
        [xScale.range()[1], 0],
      ])
      .on(`zoom`, (event) => {
        xScale2 = event.transform.rescaleX(xScale);
        data = dataArr
          .map((e) => {
            const d = JSON.parse(JSON.stringify(e));
            if (
              new Date(d.start).getTime() < xScale2.domain()[0].getTime() &&
              new Date(d.end).getTime() > xScale2.domain()[0].getTime()
            )
              d.start = xScale2.domain()[0].getTime();
            if (
              new Date(d.start).getTime() < xScale2.domain()[1].getTime() &&
              new Date(d.end).getTime() > xScale2.domain()[1].getTime()
            )
              d.end = xScale2.domain()[1].getTime();
            return d;
          })
          .filter((e) => {
            return (
              new Date(e.start).getTime() >= xScale2.domain()[0].getTime() &&
              new Date(e.end).getTime() <= xScale2.domain()[1].getTime()
            );
          });
        redraw();
      });
    svg.call(zoom);
    redraw();
  };
  draw();

  const myObserver = new ResizeObserver((e) => {
    // console.log(e);
    console.log(e[0].contentRect.width);
    options.width = document.getElementById(id).offsetWidth;
    draw();
  });
  // myObserver.unobserve(document.getElementById(id));
  myObserver.observe(document.getElementById(divId));
}

export default renderHeatTimeline;
export { renderHeatTimeline };
