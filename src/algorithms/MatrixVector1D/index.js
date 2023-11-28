import { useCallback, useMemo, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { PlayArrow as PlayIcon, Replay as ReplayIcon } from '@mui/icons-material';
import Canvas from 'components/Canvas';
import Transition from 'components/Transition';
import SystolicArray, { BOTTOM_UP, RIGHT_LEFT } from 'lib/SystolicArray';

const TRANSITION = `
v' = v + a * u
u' = u
`;

const A = [
  [1, 1, 1, 1],
  [1, -1, 1, -1],
  [1, 0, 1, 0],
];
const U = [1, 2, 3, 4];

const MatrixVector1D = () => {
  const [systolicArray, setSystolicArray] = useState(null);

  const [matrix, setMatrix] = useState(null);
  const [vector, setVector] = useState(null);

  const handleRestart = () => {
    const a = A.map((row, index) => {
      row = [...row];
      for (let i = 1; i < A.length - index; i++) {
        row.unshift(0);
      }
      return row;
    });
    const u = [...U];
    for (let i = 1; i < A.length; i++) {
      u.push(0);
    }
    setMatrix(a);
    setVector(u);

    const descriptor = {
      rowsCount: a.length,
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

    setSystolicArray(SystolicArray.create(descriptor));
  };

  const handleStep = () => {
    if (vector.length) {
      const values = { a: matrix.map(row => (row.length ? row[0] : 0)), u: vector.slice(0, 1) };
      console.log('New values', values);
      setMatrix(matrix.map(row => row.slice(1)));
      setVector(vector.slice(1));
      setSystolicArray(systolicArray.moveNext(values));
    }
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
        <Button variant="contained" color="primary" onClick={handleRestart}>
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
          <Stack direction="row" spacing={8} alignItems="flex-start">
            <Box p={2} overflowX="scroll">
              <Canvas draw={draw} {...canvasSize} />
            </Box>
            <Stack spacing={2}>
              <Typography whiteSpace="pre" fontFamily="monospace">
                A:{' '}
                {matrix
                  .map((row, rowIndex) =>
                    row
                      .map((cell, colIndex) =>
                        rowIndex + colIndex < A.length - systolicArray.step - 1 ? '\u2022' : cell,
                      )
                      .join(', '),
                  )
                  .join('\n   ')}
              </Typography>
              <Typography whiteSpace="pre" fontFamily="monospace">
                U: {vector.join(', ')}
              </Typography>
            </Stack>
          </Stack>
        </>
      )}
    </Stack>
  );
};

export default MatrixVector1D;
