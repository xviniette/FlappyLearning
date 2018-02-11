/**
 * Provides a set of classes and methods for handling GeneticDeep and
 * genetic algorithms.
 *
 * @param options An object of options for GeneticDeep.
 */
class GeneticDeep {
    constructor(options) {
        this.generations = null;

        this.options = {
            /**
             * Sigmoid function.
             *
             * @param value Input value.
             * @param layer from what is called this function
             * @param layers list of all layers inside the network
             * @return number Logistic function output.
             */
            activation: function (value, layer, layers) {
                return (1 / (1 + Math.exp(-value)))
            },

            /**
             * Returns a random value between -1 and 1.
             *
             * @return number Random value.
             */
            randomClamped: function () {
                return Math.random() * 2 - 1;
            },

            // various factors and parameters (along with default values).
            network: [1, [1], 1], // Perceptron network structure (1 hidden
            // layer).
            population: 50, // Population by generation.
            elitism: 0.2, // Best networks kepts unchanged for the next
            // generation (rate).
            randomBehaviour: 0.2, // New random networks for the next generation
            // (rate).
            mutationRate: 0.1, // Mutation rate on the weights of synapses.
            mutationRange: 0.5, // Interval of the mutation changes on the
            // synapse weight.
            historic: 0, // Latest generations saved.
            lowHistoric: false, // Only save score (not the network).
            scoreSort: -1, // Sort order (-1 = desc, 1 = asc).
            nbChild: 1, // Number of children by breeding.
            crossOverFactor: 0.5 // breed factor for genetic algorithm (0 < f < 1)
        };

        this.setOptions(options);
        this.restart();
    }

    /**
     * Override default options.
     *
     * @param options An object of Neuroevolution options.
     * @return void
     */
    setOptions(options) {
        let keys = Object.keys(options);

        for (let i = 0; i < keys.length; i++) {
            if (this.options.hasOwnProperty(keys[i])) { // Only override if the passed in value is actually defined.
                this.options[keys[i]] = options[keys[i]];
            }
        }
    };

    /**
     * Reset and create a new Generations object.
     *
     * @return void.
     */
    restart() {
        this.generations = new Generations(this);
    };

    /**
     * Create the next generation.
     *
     * @return Array Neural Network array for next Generation.
     */
    nextGeneration() {
        const networks = this.generations.createGeneration();

        if (this.options.lowHistoric) {
            // Remove old Networks.
            if (this.generations.generations.length >= 2) {
                const genomes = this.generations.generations[this.generations.generations.length - 2].genomes;
                for (let i = 0; i < genomes.length; i++) delete genomes[i].network;
            }
        }

        if (this.options.historic !== -1) {
            // Remove older generations.
            if (this.generations.generations.length > this.options.historic + 1) {
                this.generations.generations.splice(0,
                    this.generations.generations.length - (this.options.historic + 1));
            }
        }

        return networks;
    };

    /**
     * Adds a new Genome with specified Neural Network and score.
     *
     * @param network Neural Network.
     * @param score Score value.
     * @return void.
     */
    networkScore(network, score) {
        this.generations.addGenome(score, network);
    }
}