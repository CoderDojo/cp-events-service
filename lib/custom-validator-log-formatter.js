'use strict';

module.exports = function customValidatorLogFormatter(ms, cmd, err, args) {
  return JSON.stringify({
    src: {
      ms,
      cmd,
    },
    err,
    args,
  });
};
