const aifixize = ({ fn, attempts = 5, isEvalFix = false, error = null }) => {
  if (attempts <= 0) {
    return console.warn('AI ran out of attempts', fn, error || 'Unknown error');
  }

  if (isEvalFix) {
    const { success, value, error: evalError } = attemptEval(fn);
    return success ?
      aifixize({ fn: value, attempts: attempts - 1, isEvalFix: false, error: null }) :
      fixAndRetry({ code: fn, error: evalError, attempts, isEvalFix: true });
  }

  const { success, error: callError } = attemptCall(fn);
  return success || fixAndRetry({ code: fn, error: callError, attempts, isEvalFix: false });
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

const fixAndRetry = ({ code, error, attempts, isEvalFix }) => {
  let prompt = isEvalFix ?
    `You gave me this code:\n\n${code}\n\nBut it` :
    `Here is my function:\n\n${code.toString()}\n\nIt`;
  prompt += ` causes an error: ${error}` +
    `\n\nFix it and return only the code of a new function, suitable for eval.`;

  const fixedFnCode = OpenAI.chat(prompt);
  return aifixize({ fn: fixedFnCode, attempts: attempts - 1, isEvalFix: true, error });
};
