function initialGeneration(genSize) {
  const generation = Array(genSize).fill(0);
  generation[Math.floor(genSize / 2)] = 1;
  return generation;
}

export default class CA {
  constructor(genSize, gensCount, ruleset) {
    this.current = 1;
    this.genSize = parseInt(genSize);
    this.gensCount = parseInt(gensCount);
    this.ruleset = parseInt(ruleset);
    this.generations = [initialGeneration(this.genSize)];
  }

  step() {
    const ca = new CA(this.genSize, this.gensCount, this.ruleset);
    ca.current = this.current + 1;
    ca.generations = this.generations.slice(this.generations.length === this.gensCount ? 1 : 0);
    const currentGen = this.generations[this.generations.length - 1];
    const nextGen = Array(this.genSize);
    for (let i = 0; i < this.genSize; i++) {
      let neighborhood = 0;
      for (let j = -1; j < 2; j++)
        neighborhood = (neighborhood << 1) + currentGen[(i + j + this.genSize) % this.genSize];
      nextGen[i] = (this.ruleset >> neighborhood) & 1;
    }
    ca.generations.push(nextGen);
    return ca;
  }
}
