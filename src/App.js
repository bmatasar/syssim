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
import ElementaryCA from './algorithms/ElementaryCA';
import PolynomialEval from './algorithms/PolynomialEval';
import MatrixVector1D from 'algorithms/MatrixVector1D';

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
      { id: 'polyeval', label: 'Polynomial Eval', component: PolynomialEval },
      { id: 'matrixvector1d', label: 'Matrix Vector Multiplication', component: MatrixVector1D },
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
    <Box display="flex" height="100%" bgcolor="pink">
      <AppBar position="fixed" sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <StyledImg src={logo} alt="Systolic Algorithms" />
          <Typography variant="h6" color="inherit" noWrap>
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
        <Box overflow="auto">
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
      <Box component="main" flexGrow={1} bgcolor="background.default" p={3}>
        <Toolbar />
        {Algorithm && <Algorithm />}
      </Box>
    </Box>
  );
}

export default App;
