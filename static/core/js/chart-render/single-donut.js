const defaultOptions = {
  unit: `%`,
  format: `.1f`,
  width: 150,
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
      key: key1,
      value: value1
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

function renderSingleDonut(domId, dataArr, opt) {
  // eslint-disable-next-line no-use-before-define
  // const d3 = d3;
  const id = domId.replace(/^#/i, ``);
  console.log(`renderSingleDonut(${domId || ``})`);
  const options = Object.assign(defaultOptions, opt);

  let data = dataArr;
  const dataTotal = dataArr.reduce((sum, e) => sum + e.value, 0);
  console.log(`dataArr:`, dataArr);
  if (options.unit === `%`) {
    data = dataArr.map((e) => {
      return {
        key: e.key,
        value: (100.0 * e.value) / dataTotal,
      };
    });
  }
  console.log(`dataTotal:`, dataTotal);
  console.log(`data:`, data);

  // eslint-disable-next-line no-undef
  const dom = document.getElementById(id);
  console.log(dom);
  const margin = 10;
  const { width } = options;
  const height = width;
  const radius = Math.min(width, height) / 2 - margin;
  // const duration = 1500;

  d3.select(`#${id}`).selectAll("*").remove();

  const svg = d3
    .select(`#${id}`)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  // const color = d3.scaleOrdinal().range([`#566573`, `#3CC692`]);
  const color = d3.scaleOrdinal().range(
    options.colors && options.colors.length >= data.length
      ? [...options.colors, `#FFFFFF`]
      : [
          ...Object.keys(data).map((val, index) => {
            const indicator = (1.0 * index) / data.length;
            console.log(`indicator:`, indicator);
            return d3.interpolateRainbow(indicator);
          }),
          `#FFFFFF`,
        ]
  );
  console.log(`color:`, color);

  const textKey = svg
    .append(`text`)
    .attr(`text-anchor`, `middle`)
    .attr(`fill`, `#343a40`)
    .attr(`stroke`, `#343a40`)
    .attr(`dy`, options.key.dy)
    .style(`font-size`, options.key.size)
    .style(`opacity`, 0);

  const textValue = svg
    .append(`text`)
    .attr(`text-anchor`, `middle`)
    .attr(`fill`, `#343a40`)
    .attr(`stroke`, `#343a40`)
    .attr(`dy`, options.value.dy)
    .style(`font-size`, options.value.size)
    .style(`opacity`, 0);

  const showValueOf = function (i) {
    const k = data[i].key;
    const v = data[i].value;

    console.log(`text of [${i}]:`, k, `:`, v);

    // d3.select(this).

    textKey
      .text(`${k}`)
      .transition()
      .duration(options.animate.textDuration)
      .style(`opacity`, 1);
    textValue
      .text(`${options.value.format(v)} ${options.unit}`)
      .transition()
      .duration(options.animate.textDuration)
      .style(`opacity`, 1);
  };

  const pie = d3.pie().sort(null);

  const arc = d3
    .arc()
    .innerRadius(radius * 0.8)
    .outerRadius(radius);

  const path = svg
    .selectAll("path")
    .data(pie([...data.map(() => 0), 100]))
    .enter()
    .append(`g`)
    .attr(`class`, `arc`)
    .append(`path`)
    .attr(`fill`, function (d, i) {
      console.log(`color:`, color(i));
      return color(i);
    })
    .attr("d", arc)
    .each(function (d) {
      this._current = d;
    })
    .attr(`transform`, `translate(0, 0)`);

  // const progress = 0;

  const timeout = [
    setTimeout(() => {
      clearTimeout(timeout[0]);
      path
        .transition()
        .duration(options.animate.pieDuration)
        .attrTween(`d`, function (a) {
          const i = d3.interpolate(this._current, a);
          // const i2 = d3.interpolate(progress, percent);
          this._current = i(0);
          return function (t) {
            return arc(i(t));
          };
        });
      path.data(pie([...data.map((e) => e.value), 0]));
    }, options.animate.pieDelay),
    setTimeout(() => {
      clearTimeout(timeout[1]);
      if (options.defaultDisplay >= 0) showValueOf(options.defaultDisplay);
    }, options.animate.textDelay),
    setTimeout(() => {
      path
        .on(`mouseover`, function (d, i) {
          d3.select(this)
            .transition()
            .duration(options.animate.hoverEffectDuration)
            .attr(`stroke`, `white`);
          console.log(`mouseover d:`, d);
          console.log(`mouseover i:`, i);
          showValueOf(i.index);
        })
        .on(`mouseout`, function (d, i) {
          d3.select(this)
            .transition()
            .duration(options.animate.hoverEffectDuration)
            .attr(`stroke`, `none`);
        });
    }, options.animate.pieDelay + options.animate.pieDuration),
  ];
}

export default renderSingleDonut;
export { renderSingleDonut };
