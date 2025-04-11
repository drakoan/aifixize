const aifixize = (fn, attempts = 5, isEvalFix = false, error = null) => {
  if (attempts <= 0) {
    return console.warn('AI ran out of attempts', fn, error || 'Unknown error');
  }

  if (isEvalFix) {
    const evalResult = attemptEval(fn);
    return evalResult.success ?
      aifixize(evalResult.value, attempts - 1, false, null) :
      fixAndRetry(fn, evalResult.error, attempts, true);
  } else {
    const callResult = attemptCall(fn);
    return callResult.success ? undefined :
      fixAndRetry(fn, callResult.error, attempts, false);
  }
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
    `You gave me this code:\n\n${fn}\n\nBut it causes an error: ${error}\n\nFix it` :
    `Here is my function:\n\n${fn.toString()}\n\nIt causes an error: ${error}\n\nFix it`;
  prompt += ' and return only the code of a new function, suitable for eval.';

  const fixedFnCode = OpenAI.chat(prompt);
  return aifixize(fixedFnCode, attempts - 1, true, error);
};
