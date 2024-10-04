import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Stack, TextField, Typography, styled } from '@mui/material';
import {
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Replay as ReplayIcon,
} from '@mui/icons-material';
import CA from './CA';

const REFRESH_RATE = 1000;

const CellBlack = styled('div')({
  width: 10,
  height: 10,
  backgroundColor: 'black',
});

const CellWhite = styled('div')({
  width: 10,
  height: 10,
  backgroundColor: 'white',
});

const classes = {};

const checkInt = (n, min, max) => {
  n = parseInt(n);
  if (isNaN(n)) return false;
  if (!isNaN(min) && n < min) return false;
  if (!isNaN(max) && n > max) return false;
  return true;
};

const ElementaryCA = () => {
  const timerId = useRef(null);

  const [gensCount, setGensCount] = useState(65);
  const [genSize, setGenSize] = useState(131);
  const [ruleset, setRuleset] = useState(30);
  const [automaton, setAutomaton] = useState(new CA(genSize, gensCount, ruleset));

  const handleRestart = useCallback(() => {
    if (checkInt(genSize, 40) && checkInt(gensCount, 10) && checkInt(ruleset, 0, 255))
      setAutomaton(new CA(genSize, gensCount, ruleset));
  }, [gensCount, genSize, ruleset]);

  const handlePlayPause = useCallback(() => {
    if (timerId.current) {
      clearInterval(timerId.current);
      timerId.current = null;
    } else {
      timerId.current = setInterval(
        () => setAutomaton(automaton => automaton.step()),
        REFRESH_RATE,
      );
    }
  }, []);

  useEffect(
    () => () => {
      if (timerId.current) clearInterval(timerId.current);
    },
    [],
  );

  const invalidGenSize = !checkInt(genSize, 40);
  const invalidGensCount = !checkInt(gensCount, 10);
  const rs = parseInt(ruleset);
  const invalidRuleset = !checkInt(ruleset, 0, 255);

  const generations = automaton.generations.map((generation, index) => {
    const genIndex = automaton.current - automaton.generations.length + index;
    return (
      <Stack
        key={genIndex}
        direction="row"
        sx={{
          justifyContent: 'center',
        }}
      >
        {generation.map((value, i) => (value ? <CellBlack key={i} /> : <CellWhite key={i} />))}
      </Stack>
    );
  });

  for (let i = automaton.generations.length; i < gensCount; i++) {
    const genIndex = automaton.current - automaton.generations.length + i;
    generations.push(
      <div className={classes.generation} key={genIndex}>
        <div className={classes.cellWhite} key={0} />
      </div>,
    );
  }

  return (
    <Stack
      direction="column"
      spacing={2}
      sx={{
        p: 2,
        flex: 1,
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: 'flex-start',
        }}
      >
        <TextField
          size="small"
          label="Ruleset"
          helperText="An integer between 0 and 255"
          type="number"
          value={ruleset}
          error={invalidRuleset}
          onChange={event => setRuleset(event.target.value)}
        />
        <Button
          variant="contained"
          color="primary"
          disabled={invalidRuleset}
          onClick={handleRestart}
        >
          Restart
          <ReplayIcon />
        </Button>
        {automaton.ruleset === rs && !timerId.current && (
          <Button variant="contained" color="primary" onClick={handlePlayPause}>
            Play
            <PlayIcon />
          </Button>
        )}
        {automaton.ruleset === rs && timerId.current && (
          <Button variant="contained" color="primary" onClick={handlePlayPause}>
            Pause
            <PauseIcon />
          </Button>
        )}
        <Box
          sx={{
            flex: 1,
          }}
        />
        <TextField
          size="small"
          label="Generation Size"
          helperText="The number of cells in a generation"
          type="number"
          value={genSize}
          error={invalidGenSize}
          onChange={event => setGenSize(event.target.value)}
        />
        <TextField
          size="small"
          label="Generations Count"
          helperText="The number of generations"
          type="number"
          value={gensCount}
          error={invalidGensCount}
          onChange={event => setGensCount(event.target.value)}
        />
      </Stack>
      <Typography
        variant="h6"
        sx={{
          flex: 1,
          textAlign: 'center',
        }}
      >
        Ruleset: {automaton.ruleset} Generation: {automaton.current}
      </Typography>
      <Stack
        direction="column"
        sx={{
          justifyContent: 'center',
          alignItems: 'stretch',
          p: 2,
        }}
      >
        {generations}
      </Stack>
    </Stack>
  );
};

export default ElementaryCA;
