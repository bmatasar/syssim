import { useMemo, useState } from 'react';
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  styled,
  Toolbar,
  Typography,
} from '@mui/material';
import logo from './logo.svg';
import ElementaryCA from 'algorithms/ElementaryCA';
import FIRBidirectional2Slow from 'algorithms/FIRBidirectional2Slow';
import FIRBroadcast from 'algorithms/FIRBroadcast';
import FIRInputFaster from 'algorithms/FIRInputFaster';
import FIROutputFaster from 'algorithms/FIROutputFaster';
import FIRRippling from 'algorithms/FIRRippling';
import MatrixVector1D from 'algorithms/MatrixVector1D';
import PolynomialEval from 'algorithms/PolynomialEval';
import Primes from 'algorithms/Primes';

const StyledImg = styled('img')(({ theme }) => ({
  height: 40,
  marginRight: theme.spacing(2),
}));

const drawerWidth = 240;

const ALGORITHMS = [
  {
    id: 'cellular',
    label: 'Cellular Automata',
    algorithms: [
      { id: 'eca', label: 'Elementary CA', component: ElementaryCA },
      { id: 'gol', label: 'Game Of Life' },
    ],
  },
  {
    id: 'systolic',
    label: 'Systolic Algorithms',
    algorithms: [
      { id: 'primes', label: 'Finding Primes', component: Primes },
      { id: 'polyeval', label: 'Polynomial Eval', component: PolynomialEval },
      { id: 'matrixvector1d', label: 'Matrix Vector Multiplication', component: MatrixVector1D },
    ],
  },
  {
    id: 'filters',
    label: 'Filters',
    algorithms: [
      { id: 'firrippling', label: 'FIR with Rippling', component: FIRRippling },
      { id: 'firbroadcast', label: 'FIR with Broadcast', component: FIRBroadcast },
      { id: 'firoutputfaster', label: 'FIR Output Faster', component: FIROutputFaster },
      { id: 'firinputfaster', label: 'FIR Input Faster', component: FIRInputFaster },
      {
        id: 'firbidir2slow',
        label: 'FIR Bidirectional 2-Slow',
        component: FIRBidirectional2Slow,
      },
    ],
  },
];

function App() {
  const [algorithmId, setAlgorithmId] = useState('eca');

  const algorithm = useMemo(
    () => ALGORITHMS.flatMap(section => section.algorithms).find(alg => alg.id === algorithmId),
    [algorithmId],
  );

  const Algorithm = algorithm?.component;

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        bgcolor: 'pink',
      }}
    >
      <AppBar position="fixed" sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <StyledImg src={logo} alt="Systolic Algorithms" />
          <Typography
            variant="h6"
            noWrap
            sx={{
              color: 'inherit',
            }}
          >
            Systolic Algorithms Simulator
            {algorithm && ` - ${algorithm.label}`}
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box
          sx={{
            overflow: 'auto',
          }}
        >
          <List>
            {ALGORITHMS.map(section => (
              <Box key={section.id}>
                <Divider>
                  <strong>{section.label}</strong>
                </Divider>
                {section.algorithms.map(alg => (
                  <ListItemButton
                    key={alg.id}
                    selected={algorithmId === alg.id}
                    onClick={() => setAlgorithmId(alg.id)}
                  >
                    <ListItemText primary={alg.label} />
                  </ListItemButton>
                ))}
              </Box>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
        }}
      >
        <Toolbar />
        {Algorithm && <Algorithm />}
      </Box>
    </Box>
  );
}

export default App;
