/*NEURAL NETWORK**************************************************************/
/**
 * Network class
 *
 * A network is composed of at least 2 layers but a minimum of 3 is recommended :
 * input layer, hidden layers and output layer
 *
 * These layers are composed by neurons (specified number in parameter) with have
 * a weight by connected neuron from previous layer
 * Example : there are 3 neurons on the input layer, on the neurons of the first
 * hidden layer there will be 3 weights on each neuron
 *
 * So here you creates an network, you put some values on the input and you get an output
 * Also, because it's a perceptron network all weights of neuron are random, this randomness will help to find
 * the good case, helped with the genetic algorithm which keeps the best networks
 */

class Network {
    constructor(geneticDeep) {
        this.geneticDeep = geneticDeep;
        this.layers = [];
    }

    /**
     * Generate the Network layers.
     *
     * @param nbInputs Number of Neurons in Input layer.
     * @param hiddenLayersAndInnerNeurons Number of Neurons per Hidden layer.
     * @param nbOutputs Number of Neurons in Output layer.
     * @return Network
     */
    perceptronGeneration(nbInputs, hiddenLayersAndInnerNeurons, nbOutputs) {
        //first layer is input layer with no input connections (because it's the first layer)
        let previousNeurons = this.addLayer(nbInputs, 0);

        for (let i = 0; i < hiddenLayersAndInnerNeurons.length; i++) //for each hidden layer
            previousNeurons = this.addLayer(hiddenLayersAndInnerNeurons[i], previousNeurons);

        this.addLayer(nbOutputs, previousNeurons);

        return this;
    };

    /**
     * Add a new layer into the network
     * @param nbNeurons of the layer
     * @param nbInputsOnEachNeuron connected to each neuron of the layer
     * @returns {*}
     */
    addLayer(nbNeurons, nbInputsOnEachNeuron) {
        var layer = new Network.Layer();
        layer.populate(nbNeurons, nbInputsOnEachNeuron, this.geneticDeep.options.randomClamped);

        this.layers.push(layer);

        return nbNeurons;
    };

    /**
     * Compute the output of an input.
     *
     * @param inputs Set of inputs (entry values).
     * @return Array output or null if there are no layers.
     */
    compute(inputs) {
        if (this.layers.length > 0) {
            var inputLayer = this.layers[0];

            //set input values inside neurons of the input layer
            for (var i = 0; i < inputs.length && i < inputLayer.neurons.length; i++) {
                inputLayer.neurons[i].value = inputs[i];
            }

            var prevLayer = inputLayer; // Previous layer is input layer.
            var sum;

            for (var x = 1; x < this.layers.length; x++) { //exploring hidden and output layers (which have connections)
                for (var y = 0; y < this.layers[x].neurons.length; y++) { //exploring neurons of each layer
                    sum = 0; //we make the sum of the product input and weight which will be the neuron value

                    for (var z = 0; z < prevLayer.neurons.length; z++) {
                        // Every Neuron in the previous layer is an input to each Neuron in
                        // the next layer, we make the product of the input value and the weight in that input
                        sum += prevLayer.neurons[z].value * this.layers[x].neurons[y].weights[z];
                    }

                    // Compute the activation of the Neuron.
                    this.layers[x].neurons[y].value = this.geneticDeep.options.activation(sum);
                }

                prevLayer = this.layers[x];
            }

            // All outputs of the Network.
            var out = [];
            var lastLayer = this.layers[this.layers.length - 1];

            for (var j = 0; j < lastLayer.neurons.length; j++) {
                out.push(lastLayer.neurons[j].value);
            }

            //console.log('out', out);

            return out;
        }

        return null;
    };

    /**
     * Generate clone of current network
     * @returns {Network}
     */
    clone() {
        let network = new Network(this.geneticDeep);
        let previousNeurons = 0;

        for (let i = 0; i < this.layers.length; i++) {
            previousNeurons = network.addLayer(this.layers[i].neurons.length, previousNeurons);

            for (let j = 0; j < this.layers[i].neurons.length; j++) {
                for (let k = 0; k < this.layers[i].neurons[j].weights.length; k++) {
                    network.layers[i].neurons[j].weights[k] = this.layers[i].neurons[j].weights[k];
                }
            }
        }

        return network;
    }
}

/*LAYER***********************************************************************/
/**
 * Neural Network Layer class.
 */
Network.Layer = class {
    constructor() {
        this.neurons = [];
    }

    /**
     * Populate the Layer with a set of randomly weighted Neurons.
     *
     * Each Neuron be initialised with nbInputs inputs with a random clamped
     * value.
     *
     * @param nbNeurons Number of neurons.
     * @param nbInputs Number of inputs.
     * @param randomMethod callback of a method that returns a random value
     * @return void
     */
    populate(nbNeurons, nbInputs, randomMethod) {
        this.neurons = [];
        for (var i = 0; i < nbNeurons; i++) {
            var n = new Network.Layer.Neuron();
            n.populate(nbInputs, randomMethod);
            this.neurons.push(n);
        }
    };
};

/*NEURON**********************************************************************/
/**
 * Artificial Neuron class
 */
Network.Layer.Neuron = class {
    constructor() {
        this.value = 0; //computed value when input values on compute method from Network class
        this.weights = []; //size depends on connected inputs on the neuron
    }

    /**
     * Initialize number of neuron weights to random clamped values.
     *
     * @param nb Number of neuron weights (number of inputs).
     * @param randomMethod callback of a method that returns a random value
     * @return void
     */
    populate(nb, randomMethod) {
        this.weights = [];
        for (var i = 0; i < nb; i++) {
            //console.log(Math.random() * 2 - 1);
            this.weights.push(randomMethod()/*Math.random() * 2 - 1*/);
        }
    };
};

//TODO: remove following methods (setSave/getSave)

/**
 * Create a copy of the Network (neurons and weights).
 *
 * Returns number of neurons per layer and a flat array of all weights.
 *
 * @return {neurons: Array, weights: Array} data.
 */
/*
Network.prototype.getSave = function () {
    var data = {
        neurons: [], // Number of Neurons per layer.
        weights: [] // Weights of each Neuron's inputs.
    };

    for (var i in this.layers) {
        data.neurons.push(this.layers[i].neurons.length);
        for (var j in this.layers[i].neurons) {
            for (var k in this.layers[i].neurons[j].weights) {
                // push all input weights of each Neuron of each Layer into a flat
                // array.
                data.weights.push(this.layers[i].neurons[j].weights[k]);
            }
        }
    }

    return data;
};
*/

/**
 * Apply network data (neurons and weights).
 *
 * @param save Copy of network data (neurons and weights).
 * @return void
 */
/*
Network.prototype.setSave = function (save) {
    var previousNeurons = 0;
    var indexWeights = 0;
    this.layers = [];
    for (var i in save.neurons) {
        // Create and populate layers.
        var layer = new Layer();
        layer.populate(save.neurons[i], previousNeurons);
        for (var j in layer.neurons) {
            for (var k in layer.neurons[j].weights) {
                // Apply neurons weights to each Neuron.
                layer.neurons[j].weights[k] = save.weights[indexWeights];

                indexWeights++; // Increment index of flat array.
            }
        }
        previousNeurons = save.neurons[i];
        this.layers.push(layer);
    }
}
*/