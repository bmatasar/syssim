import { useCallback, useMemo, useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { PlayArrow as PlayIcon, Replay as ReplayIcon } from '@mui/icons-material';
import SystolicArray, { BOTTOM_UP, RIGHT_LEFT } from 'lib/SystolicArray';
import { parseNumbers } from 'lib/utils';
import Canvas from 'components/Canvas';
import Transition from 'components/Transition';

const TRANSITION = `
v' = v + a * u
u' = u
`;

const MatrixVector1D = () => {
  const [systolicArray, setSystolicArray] = useState(null);

  const [coefficients, setCoefficients] = useState('');
  const [input, setInput] = useState('');
  const [inputValues, setInputValues] = useState([]);

  const validCoefficients = parseNumbers(coefficients)?.length > 0;
  const validInput = parseNumbers(input)?.length > 0;

  const handleRestart = () => {
    const coeffs = parseNumbers(coefficients);
    const inputValues = parseNumbers(input);
    if (coeffs?.length < 1 || inputValues?.length < 1) return;

    const descriptor = {
      rowsCount: coeffs.length,
      startIndex: 1,
      registers: [
        {
          name: 'v',
          fx: ({ a, u, v }) => v + a * u,
        },
      ],
      wires: [
        {
          name: 'a',
          direction: RIGHT_LEFT,
        },
        {
          name: 'u',
          direction: BOTTOM_UP,
        },
      ],
    };

    setInputValues(inputValues);
    setSystolicArray(SystolicArray.create(descriptor));
  };

  const handleStep = () => {
    const values = { a: [0], u: [0] };
    if (inputValues.length > 0) {
      values.u[0] = inputValues[0];
      setInputValues(inputValues.slice(1));
    }
    setSystolicArray(systolicArray.moveNext(values));
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
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Typography>Step: {systolicArray.step}</Typography>
            <Typography>Input: {inputValues.join(', ')}</Typography>
          </Stack>
          <Box p={2} overflowX="scroll">
            <Canvas draw={draw} {...canvasSize} />
          </Box>
        </>
      )}
    </Stack>
  );
};

export default MatrixVector1D;
