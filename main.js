const aifixize = (fn, attempts = 5, isEvalFix = false, error = null) => {
  if (attempts <= 0) {
    return console.warn('AI ran out of attempts', fn, error || 'Unknown error');
  }

  if (isEvalFix) {
    const { success, value, error } = attemptEval(fn);
    return success ?
      aifixize(value, attempts - 1, false, null) :
      fixAndRetry(fn, error, attempts, true);
  }

  const { success, error } = attemptCall(fn);
  return success || fixAndRetry(fn, error, attempts, false);
};

const attemptEval = code => {
  try {
    const result = eval(code);
    return { success: true, value: result };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
};

const attemptCall = fn => {
  try {
    fn();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
};

const fixAndRetry = (fn, error, attempts, isEvalFix) => {
  let prompt = isEvalFix ?
    `You gave me this code:\n\n${fn}\n\nBut it` :
    `Here is my function:\n\n${fn.toString()}\n\nIt`;
  prompt += ` causes an error: ${error}` +
    `\n\nFix it and return only the code of a new function, suitable for eval.`;

  const fixedFnCode = OpenAI.chat(prompt);
  return aifixize(fixedFnCode, attempts - 1, true, error);
};
