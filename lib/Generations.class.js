/*GENERATIONS*****************************************************************/
/**
 * Generations class.
 *
 * Hold's previous Generations and current Generation.
 */
class Generations {
    /**
     * @constructor
     * @param geneticDeep main class object used to access the options
     */
    constructor(geneticDeep) {
        this.geneticDeep = geneticDeep;
        this.generations = [];
    }

    /**
     * Create a new generation
     * @returns Array
     */
    createGeneration() {
        let out;

        if (this.generations.length > 0) {
            //based on previous generations
            out = this.generations[this.generations.length - 1].generateNextGeneration();
        }
        else {
            //generate all from scratch
            out = [];

            for (let i = 0; i < this.geneticDeep.options.population; i++) {
                // Generate the Network and save it in array.
                const network = new Network(this.geneticDeep).perceptronGeneration(
                    this.geneticDeep.options.network[0],
                    this.geneticDeep.options.network[1],
                    this.geneticDeep.options.network[2]);

                out.push(network);
            }
        }

        this.generations.push(new Generations.Generation(this.geneticDeep));

        return out;
    };

    /**
     * Get current generation if exists
     * @returns {null}
     */
    getCurrentGeneration() {
        return this.generations.length > 0 ? this.generations[this.generations.length - 1] : null;
    };

    /**
     * Add a genome to the Generations.
     *
     * @param score
     * @param network
     * @return void
     */
    addGenome(score, network) {
        const currentGeneration = this.getCurrentGeneration();
        if (currentGeneration !== null) currentGeneration.addGenome(new Generations.Generation.Genome(score, network));
    };
}

/*GENERATION******************************************************************/
/**
 * Generation class.
 * Composed of a set of Genomes.
 */
Generations.Generation = class {
    constructor(geneticDeep) {
        this.geneticDeep = geneticDeep;
        this.genomes = [];
    }

    /**
     * Add a genome to the generation.
     *
     * @param genome
     * @return void.
     */
    addGenome(genome) {
        // Locate position to insert Genome into.
        // The gnomes should remain sorted.
        let i = 0;

        for (; i < this.genomes.length; i++) {
            // Sort in descending order.
            if (this.geneticDeep.options.scoreSort < 0) {
                if (genome.score > this.genomes[i].score) {
                    break;
                }
                // Sort in ascending order.
            } else {
                if (genome.score < this.genomes[i].score) {
                    break;
                }
            }

        }

        // Insert genome into correct position.
        this.genomes.splice(i, 0, genome);
    };

    /**
     * Breed to genomes to produce offspring(s).
     *
     * @param g1 Genome 1.
     * @param g2 Genome 2.
     * @param nbChildren Number of offspring (children).
     */
    breed(g1, g2, nbChildren) {
        const networks = [];
        let k, l, m;

        for (let nb = 0; nb < nbChildren; nb++) {
            const data = g1.clone();

            for (k = 0; k < g2.layers.length; k++) {
                for (l = 0; l < g2.layers[k].neurons.length; l++) {
                    for (m = 0; m < g2.layers[k].neurons[l].weights.length; m++) {
                        if (Math.random() <= this.geneticDeep.options.crossOverFactor) {
                            data.layers[k].neurons[l].weights[m] = g2.layers[k].neurons[l].weights[m];
                        }
                    }
                }
            }

            for (k = 0; k < g2.layers.length; k++) {
                for (l = 0; l < g2.layers[k].neurons.length; l++) {
                    for (m = 0; m < g2.layers[k].neurons[l].weights.length; m++) {
                        if (Math.random() <= this.geneticDeep.options.mutationRate) {
                            data.layers[k].neurons[l].weights[m] += Math.random() *
                                this.geneticDeep.options.mutationRange *
                                2 -
                                this.geneticDeep.options.mutationRange;
                        }
                    }
                }
            }

            networks.push(data);
        }

        return networks;
    };

    /**
     * Generate the next generation.
     *
     * @return Array Next generation data array.
     */
    generateNextGeneration() {
        const networks = [];
        let i;

        console.log('generateNextGeneration', Math.round(this.geneticDeep.options.elitism * this.geneticDeep.options.population));

        //elitism method: the best are saved for the next generation
        for (i = 0; i < Math.round(this.geneticDeep.options.elitism * this.geneticDeep.options.population); i++) {
            if (networks.length < this.geneticDeep.options.population) {
                // Push a deep copy of ith Genome's Network, add a new network with same weights
                networks.push(this.genomes[i].network.clone());
            }
        }

        console.log('random', networks.length);

        //random method: from the first network are generated random weights
        for (i = 0; i < Math.round(this.geneticDeep.options.randomBehaviour *
            this.geneticDeep.options.population); i++) {
            const network = this.genomes[0].network.clone();

            for (let k = 0; k < network.layers.length; k++) {
                for (let l = 0; l < network.layers[k].neurons.length; l++) {
                    for (let m = 0; m < network.layers[k].neurons[l].weights.length; m++) {
                        network.layers[k].neurons[l].weights[m] = this.geneticDeep.options.randomClamped();
                    }
                }
            }

            if (networks.length < this.geneticDeep.options.population) {
                networks.push(network);
            }
        }

        console.log('breed', networks.length);

        let max = 0;

        while (true) {
            for (i = 0; i < max; i++) {
                // Create the children and push them to the networks array.
                const children = this.breed(this.genomes[i].network, this.genomes[max].network,
                    (this.geneticDeep.options.nbChild > 0 ? this.geneticDeep.options.nbChild : 1));

                for (let c = 0; c < children.length; c++) {
                    networks.push(children[c]);

                    if (networks.length >= this.geneticDeep.options.population) {
                        // Return once number of children is equal to the
                        // population by generation value.
                        return networks;
                    }
                }
            }

            max++;

            if (max >= this.genomes.length - 1) {
                max = 0;
            }
        }
    };
};

/*GENOME**********************************************************************/
/**
 * Genome class.
 * Composed of a score and a Neural Network.
 *
 * @param score
 * @param network
 */
Generations.Generation.Genome = class {
    constructor(score, network) {
        this.score = score || 0;
        this.network = network || null;
    }
};