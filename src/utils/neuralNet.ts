import { NeuralNet } from '../types/swarm';

export function createNeuralNet(): NeuralNet {
  return {
    weights1: Array.from({ length: 8 }, () => 
      Array.from({ length: 6 }, () => Math.random() * 2 - 1)
    ),
    weights2: Array.from({ length: 4 }, () => 
      Array.from({ length: 8 }, () => Math.random() * 2 - 1)
    ),
    bias1: Array.from({ length: 8 }, () => Math.random() * 2 - 1),
    bias2: Array.from({ length: 4 }, () => Math.random() * 2 - 1),
  };
}

export function forwardPass(net: NeuralNet, inputs: number[]): number[] {
  // Hidden layer with tanh activation
  const hidden = net.weights1.map((weights, i) => {
    const sum = weights.reduce((acc, w, j) => acc + w * inputs[j], 0) + net.bias1[i];
    return Math.tanh(sum);
  });

  // Output layer with tanh activation
  const output = net.weights2.map((weights, i) => {
    const sum = weights.reduce((acc, w, j) => acc + w * hidden[j], 0) + net.bias2[i];
    return Math.tanh(sum);
  });

  return output;
}

export function getNeuralInputs(
  distToTarget: number,
  angleToTarget: number,
  energy: number,
  neighborCount: number,
  pheromoneStrength: number,
  speed: number
): number[] {
  return [
    distToTarget / 500,  // normalized distance
    angleToTarget / Math.PI,  // normalized angle
    energy / 100,  // normalized energy
    Math.min(neighborCount / 10, 1),  // normalized neighbor count
    pheromoneStrength,  // 0-1
    speed / 5,  // normalized speed
  ];
}
