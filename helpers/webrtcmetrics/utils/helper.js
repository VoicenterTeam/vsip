//import shortUUID from "./shortUUId";
import shortUUID from "generate-unique-id";

import {
  defaultAudioMetricIn,
  defaultAudioMetricOut,
  defaultVideoMetricIn,
  defaultVideoMetricOut,
  DIRECTION,
  VALUE,
} from "./models";

const getValues = (reports, key, subKey, avoidZeroValue = false, ssrc) => {
  let arr = reports.map((report) => {
    if (!subKey) {
      return report[key];
    }
    if (!ssrc) {
      return report[key][subKey];
    }
    const data = report[key][ssrc];
    if (data) {
      return data[subKey];
    }
    return null;
  });

  // Avoid null value
  arr = arr.filter((item) => {
    if (avoidZeroValue) {
      return (Number.isFinite(item) && item > 0);
    }
    return Number.isFinite(item);
  });
  if (arr.length === 0) {
    return [];
  }
  return arr;
};

export const average = (nums) => (nums.reduce((a, b) => a + b, 0) / nums.length);

export const createProbeId = () => (`probe-${shortUUID()}`);

export const createCollectorId = () => (`coltr-${shortUUID()}`);

export const timeout = (ms) => (new Promise((resolve) => setTimeout(resolve, ms)));

export const call = (fct, context, value) => {
  if (!context) {
    fct(value);
  } else {
    fct.call(context, value);
  }
};

export const volatilityValuesOfReports = (reports, key, subKey, ssrc) => {
  const values = getValues(reports, key, subKey, true, ssrc);
  if (values.length === 0) {
    return null;
  }
  const avg = values.reduce((p, c) => p + c, 0) / values.length;
  if (avg === 0) {
    return null;
  }

  const diff = values.map((data) => (Math.abs(avg - data)));
  const totalDiff = diff.reduce((p, c) => p + c, 0);
  const volatility = ((totalDiff / values.length) * 100) / avg;
  return volatility;
};

export const averageValuesOfReports = (reports, key, subKey, avoidZeroValue = false, ssrc) => {
  const values = getValues(reports, key, subKey, avoidZeroValue, ssrc);
  if (values.length === 0) {
    return null;
  }
  return values.reduce((p, c) => p + c, 0) / values.length;
};

export const sumValuesOfReports = (reports, key, subKey) => {
  const values = getValues(reports, key, subKey);
  return values.reduce((p, c) => p + c, 0);
};

export const minValueOfReports = (reports, key, subKey, ssrc) => {
  const values = getValues(reports, key, subKey, true, ssrc);
  if (values.length === 0) {
    return null;
  }
  return Math.min(...values);
};

export const maxValueOfReports = (reports, key, subKey, ssrc) => {
  const values = getValues(reports, key, subKey, false, ssrc);
  if (values.length === 0) {
    return null;
  }
  return Math.max(...values);
};

export const lastOfReports = (reports, key, subKey, ssrc) => {
  const lastReport = reports.slice().pop();
  if (!lastReport) {
    return null;
  }
  if (!subKey) {
    return lastReport[key];
  }
  if (!ssrc) {
    return lastReport[key][subKey];
  }
  const ssrcData = lastReport[key][ssrc];

  if (ssrcData) {
    return ssrcData[subKey];
  }
  return null;
};

export const getLastReport = (reports) => (reports.slice().pop());

export const getSSRCDataFromBunch = (ssrc, bunch, direction) => {
  if (!bunch) {
    return null;
  }
  const ssrcBunch = {};
  let audioBunch = bunch[VALUE.AUDIO][ssrc];
  if (!audioBunch) {
    audioBunch = direction === DIRECTION.INBOUND ? { ...defaultAudioMetricIn } : { ...defaultAudioMetricOut };
  }
  ssrcBunch[VALUE.AUDIO] = audioBunch;

  let videoBunch = bunch[VALUE.VIDEO][ssrc];
  if (!videoBunch) {
    videoBunch = direction === DIRECTION.INBOUND ? { ...defaultVideoMetricIn } : { ...defaultVideoMetricOut };
  }
  ssrcBunch[VALUE.VIDEO] = videoBunch;
  return ssrcBunch;
};
