import { useCallback, useMemo, useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { PlayArrow as PlayIcon, Replay as ReplayIcon } from '@mui/icons-material';
import Canvas from 'components/Canvas';
import Transition from 'components/Transition';
import SystolicArray, { RIGHT_LEFT } from 'lib/SystolicArray';
import { parseNumbers } from 'lib/utils';

const TRANSITION = `
x' = x
y' = y + a * x
`;

const FIRBidirectional2Slow = () => {
  const [systolicArray, setSystolicArray] = useState(null);

  const [coefficients, setCoefficients] = useState('1,2,3,4');
  const [input, setInput] = useState('1,2,3,4,5');
  const [inputValues, setInputValues] = useState([]);
  const [outputValues, setOutputValues] = useState([]);

  const validCoefficients = parseNumbers(coefficients)?.length > 0;
  const validInput = parseNumbers(input)?.length > 0;

  const handleRestart = () => {
    const coeffs = parseNumbers(coefficients);
    const inputValues = parseNumbers(input);
    if (coeffs?.length < 1 || inputValues?.length < 1) return;

    const descriptor = {
      colsCount: coeffs.length,
      registers: [
        {
          name: 'a',
          init: ({ col }) => coeffs[col],
        },
      ],
      wires: [
        {
          name: 'y',
          direction: RIGHT_LEFT,
          fx: ({ a, x, y }) => y + a * x, // Transition function. It could be missing if there is no change in the value
        },
        {
          name: 'x',
        },
      ],
    };

    // Insert delays in the input
    for (let i = 0, n = inputValues.length - 1; i < n; i++)
      inputValues.splice(i * 2 + 1, 0, 0);
    setInputValues(inputValues);
    setSystolicArray(SystolicArray.create(descriptor));
    setOutputValues([]);
  };

  const handleStep = () => {
    const values = { y: [0], x: [0] };
    if (inputValues.length > 0) {
      values.x[0] = inputValues[0];
      setInputValues(inputValues.slice(1));
    }
    const nextSystolicArray = systolicArray.moveNext(values);
    setSystolicArray(nextSystolicArray);
    const lastCell = nextSystolicArray.getCell(0);
    setOutputValues([lastCell?.y?.out[0] ?? 0, ...outputValues]);
  };

  const canvasSize = useMemo(() => systolicArray?.preferredSize(), [systolicArray]);

  const draw = useCallback(
    (context, width, height, frame) => {
      if (systolicArray) {
        systolicArray.draw(context, width, height, frame);
      }
    },
    [systolicArray],
  );

  return (
    <Stack direction="column" p={2} spacing={2} flex={1}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <TextField
          size="small"
          label="Coefficients"
          helperText="Comma-separated numbers"
          value={coefficients}
          error={parseNumbers(coefficients)?.length < 1}
          onChange={event => setCoefficients(event.target.value)}
        />
        <TextField
          size="small"
          label="Input"
          helperText="Comma-separated numbers"
          value={input}
          error={parseNumbers(input)?.length < 1}
          onChange={event => setInput(event.target.value)}
        />
        <Button
          variant="contained"
          color="primary"
          disabled={!validCoefficients || !validInput}
          onClick={handleRestart}
        >
          Restart
          <ReplayIcon />
        </Button>
        <Button variant="contained" color="primary" disabled={!systolicArray} onClick={handleStep}>
          Step
          <PlayIcon />
        </Button>
        <Box flex={1} />
        <Transition code={TRANSITION} />
      </Stack>
      {systolicArray && (
        <>
          <Typography>Step: {systolicArray.step}</Typography>
          <Typography>Input: {inputValues.join(', ')}</Typography>
          <Typography>Output: {outputValues.join(', ')}</Typography>
          <Box p={2} overflowX="scroll">
            <Canvas draw={draw} {...canvasSize} />
          </Box>
        </>
      )}
    </Stack>
  );
};

export default FIRBidirectional2Slow;
