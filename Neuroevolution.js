/**
 * Provides a set of classes and methods for handling Neuroevolution and
 * genetic algorithms.
 *
 * @param {options} An object of options for Neuroevolution.
 */
var Neuroevolution = function (options) {
	var self = this; // reference to the top scope of this module

	// Declaration of module parameters (options) and default values
	self.options = {
		/**
		 * Logistic activation function.
		 *
		 * @param {a} Input value.
		 * @return Logistic function output.
		 */
		activation: function (a) {
			var ap = (-a) / 1;
			return (1 / (1 + Math.exp(ap)))
		},

		/**
		 * Returns a random value between -1 and 1.
		 *
		 * @return Random value.
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
		nbChild: 1 // Number of children by breeding.

	}

	/**
	 * Override default options.
	 *
	 * @param {options} An object of Neuroevolution options.
	 * @return void
	 */
	self.set = function (options) {
		for (var i in options) {
			if (this.options[i] != undefined) { // Only override if the passed in value
				// is actually defined.
				self.options[i] = options[i];
			}
		}
	}

	// Overriding default options with the pass in options
	self.set(options);


	/*NEURON**********************************************************************/
	/**
	 * Artificial Neuron class
	 *
	 * @constructor
	 */
	var Neuron = function () {
		this.value = 0;
		this.weights = [];
	}

	/**
	 * Initialize number of neuron weights to random clamped values.
	 *
	 * @param {nb} Number of neuron weights (number of inputs).
	 * @return void
	 */
	Neuron.prototype.populate = function (nb) {
		this.weights = [];
		var rfunc = self.options.randomClamped;
		for (var i = 0; i < nb; i++) {
			this.weights.push(rfunc());
		}
	}


	/*LAYER***********************************************************************/
	/**
	 * Neural Network Layer class.
	 *
	 * @constructor
	 * @param {index} Index of this Layer in the Network.
	 */
	var Layer = function (index) {
		this.id = index || 0;
		this.neurons = [];
	}

	/**
	 * Populate the Layer with a set of randomly weighted Neurons.
	 *
	 * Each Neuron be initialied with nbInputs inputs with a random clamped
	 * value.
	 *
	 * @param {nbNeurons} Number of neurons.
	 * @param {nbInputs} Number of inputs.
	 * @return void
	 */
	Layer.prototype.populate = function (nbNeurons, nbInputs) {
		this.neurons = [];
		for (var i = 0; i < nbNeurons; i++) {
			var n = new Neuron();
			n.populate(nbInputs);
			this.neurons.push(n);
		}
	}


	/*NEURAL NETWORK**************************************************************/
	/**
	 * Neural Network class
	 *
	 * Composed of Neuron Layers.
	 *
	 * @constructor
	 */
	var Network = function () {
		this.layers = [];
	}

	/**
	 * Generate the Network layers.
	 *
	 * @param {input} Number of Neurons in Input layer.
	 * @param {hidden} Number of Neurons per Hidden layer.
	 * @param {output} Number of Neurons in Output layer.
	 * @return void
	 */
	Network.prototype.perceptronGeneration = function (input, hiddens, output) {
		var index = 0;
		var previousNeurons = 0;
		var layer = new Layer(index);
		layer.populate(input, previousNeurons); // Number of Inputs will be set to
		// 0 since it is an input layer.
		previousNeurons = input; // number of input is size of previous layer.
		this.layers.push(layer);
		index++;
		for (var i in hiddens) {
			// Repeat same process as first layer for each hidden layer.
			var hidden_layer = new Layer(index);
			var ihidden = hiddens[i];
			hidden_layer.populate(ihidden, previousNeurons);
			previousNeurons = ihidden;
			this.layers.push(hidden_layer);
			index++;
		}
		layer = new Layer(index);
		layer.populate(output, previousNeurons); // Number of input is equal to
		// the size of the last hidden
		// layer.
		this.layers.push(layer);
	}

	/**
	 * Create a copy of the Network (neurons and weights).
	 *
	 * Returns number of neurons per layer and a flat array of all weights.
	 *
	 * @return Network data.
	 */
	Network.prototype.getSave = function () {
		var dneurons = []; // Number of Neurons per layer.
		var dweights = []; // Weights of each Neuron's inputs.
		var datas = {
			neurons: dneurons,
			weights: dweights
		};

		for (var i in this.layers) {
			var neuron = this.layers[i].neurons;
			dneurons.push(neuron.length);
			for (var j in neuron) {
				var weights = neuron[j].weights;
				for (var k in weights) {
					// push all input weights of each Neuron of each Layer into a flat
					// array.
					dweights.push(weights[k]);
				}
			}
		}
		return datas;
	}

	/**
	 * Apply network data (neurons and weights).
	 *
	 * @param {save} Copy of network data (neurons and weights).
	 * @return void
	 */
	Network.prototype.setSave = function (save) {
		var previousNeurons = 0;
		var index = 0;
		var indexWeights = 0;
		this.layers = [];
		var sweights = save.weights;
		for (var i in save.neurons) {
			// Create and populate layers.
			var layer = new Layer(index);
			var sneuron = save.neurons[i];
			layer.populate(sneuron, previousNeurons);
			for (var j in layer.neurons) {
				var weights = layer.neurons[j].weights;
				for (var k in weights) {
					// Apply neurons weights to each Neuron.
					weights[k] = sweights[indexWeights];

					indexWeights++; // Increment index of flat array.
				}
			}
			previousNeurons = sneuron;
			index++;
			this.layers.push(layer);
		}
	}

	/**
	 * Compute the output of an input.
	 *
	 * @param {inputs} Set of inputs.
	 * @return Network output.
	 */
	Network.prototype.compute = function (inputs) {
		// Set the value of each Neuron in the input layer.
		var layer0 = this.layers[0];
		if(layer0)
		{
			var layer0_neurons = layer0.neurons;
			for (var i in inputs) {
				if (layer0_neurons[i]) {
					layer0_neurons[i].value = inputs[i];
				}
			}
		}

		var prevLayer = this.layers[0]; // Previous layer is input layer.
		var activation = self.options.activation;
		for (var i = 1, len = this.layers.length; i < len; i++) {
			var pneurons = prevLayer.neurons;
			var lneurons = this.layers[i].neurons;
			for (var j in lneurons) {
				// For each Neuron in each layer.
				var weights = lneurons[j].weights;
				var sum = 0;
				for (var k in pneurons) {
					// Every Neuron in the previous layer is an input to each Neuron in
					// the next layer.
					sum += pneurons[k].value * weights[k];
				}

				// Compute the activation of the Neuron.
				lneurons[j].value = activation(sum);
			}
			prevLayer = this.layers[i];
		}

		// All outputs of the Network.
		var out = [];
		var lastLayer_neurons = this.layers[this.layers.length - 1].neurons;
		for (var i in lastLayer_neurons) {
			out.push(lastLayer_neurons[i].value);
		}
		return out;
	}


	/*GENOME**********************************************************************/
	/**
	 * Genome class.
	 *
	 * Composed of a score and a Neural Network.
	 *
	 * @constructor
	 *
	 * @param {score}
	 * @param {network}
	 */
	var Genome = function (score, network) {
		this.score = score || 0;
		this.network = network || null;
	}


	/*GENERATION******************************************************************/
	/**
	 * Generation class.
	 *
	 * Composed of a set of Genomes.
	 *
	 * @constructor
	 */
	var Generation = function () {
		this.genomes = [];
	}

	/**
	 * Add a genome to the generation.
	 *
	 * @param {genome} Genome to add.
	 * @return void.
	 */
	Generation.prototype.addGenome = function (genome) {
		// Locate position to insert Genome into.
		// The gnomes should remain sorted.
		var scoreSort = self.options.scoreSort;
		for (var i = 0, len = this.genomes.length; i < len; i++) {
			// Sort in descending order.
			var score = this.genomes[i].score;
			if (scoreSort < 0) {
				if (genome.score > score) {
					break;
				}
				// Sort in ascending order.
			} else {
				if (genome.score < score) {
					break;
				}
			}

		}

		// Insert genome into correct position.
		this.genomes.splice(i, 0, genome);
	}

	/**
	 * Breed to genomes to produce offspring(s).
	 *
	 * @param {g1} Genome 1.
	 * @param {g2} Genome 2.
	 * @param {nbChilds} Number of offspring (children).
	 */
	Generation.prototype.breed = function (g1, g2, nbChilds) {
		var datas = [];
		var mutationRate = self.options.mutationRate;
		var mutationRange = self.options.mutationRange;
		var g2_weights = g2.network.weights;
		for (var nb = 0; nb < nbChilds; nb++) {
			// Deep clone of genome 1.
			var data = JSON.parse(JSON.stringify(g1));
			var data_weights = data.network.weights;
			for (var i in g2_weights) {
				// Genetic crossover
				// 0.5 is the crossover factor.
				// FIXME Really should be a predefined constant.
				if (Math.random() <= 0.5) {
					data_weights[i] = g2_weights[i];
				}
			}

			// Perform mutation on some weights.
			for (var i in data.network.weights) {
				if (Math.random() <= mutationRate) {
					data_weights[i] += Math.random() *
						mutationRange * 2 - mutationRange;
				}
			}
			datas.push(data);
		}

		return datas;
	}

	/**
	 * Generate the next generation.
	 *
	 * @return Next generation data array.
	 */
	Generation.prototype.generateNextGeneration = function () {
		var nexts = [];

		var population = self.options.population;
		for (var i = 0, len= Math.round(self.options.elitism *
				self.options.population); i < len; i++) {
			if (nexts.length < population) {
				// Push a deep copy of ith Genome's Nethwork.
				nexts.push(JSON.parse(JSON.stringify(this.genomes[i].network)));
			}
		}

		var funcRC = self.options.randomClamped;
		var n = JSON.parse(JSON.stringify(this.genomes[0].network));
		for (var i = 0, len = Math.round(self.options.randomBehaviour *
				self.options.population); i < len; i++) {
			for (var k in n.weights) {
				n.weights[k] = funcRC();
			}
			if (nexts.length < population) {
				nexts.push(n);
			}
		}

		var max = 0;
		var nbChild = self.options.nbChild;
		while (true) {
			var genomes_max = this.genomes[max];
			for (var i = 0; i < max; i++) {
				// Create the children and push them to the nexts array.
				var childs = this.breed(this.genomes[i], genomes_max,
					(nbChild > 0 ? nbChild : 1));
				for (var c in childs) {
					nexts.push(childs[c].network);
					if (nexts.length >= population) {
						// Return once number of children is equal to the
						// population by generatino value.
						return nexts;
					}
				}
			}
			max++;
			if (max >= this.genomes.length - 1) {
				max = 0;
			}
		}
	}


	/*GENERATIONS*****************************************************************/
	/**
	 * Generations class.
	 *
	 * Hold's previous Generations and current Generation.
	 *
	 * @constructor
	 */
	var Generations = function () {
		this.generations = [];
		//var currentGeneration = new Generation();
	}

	/**
	 * Create the first generation.
	 *
	 * @param {input} Input layer.
	 * @param {input} Hidden layer(s).
	 * @param {output} Output layer.
	 * @return First Generation.
	 */
	Generations.prototype.firstGeneration = function (input, hiddens, output) {
		// FIXME input, hiddens, output unused.

		var out = [];
		var network = self.options.network;
		var network0 = network[0];
		var network1 = network[1];
		var network2 = network[2];
		for (var i = 0; i < self.options.population; i++) {
			// Generate the Network and save it.
			var nn = new Network();
			nn.perceptronGeneration(network0, network1, network2);
			out.push(nn.getSave());
		}

		this.generations.push(new Generation());
		return out;
	}

	/**
	 * Create the next Generation.
	 *
	 * @return Next Generation.
	 */
	Generations.prototype.nextGeneration = function () {
		if (this.generations.length == 0) {
			// Need to create first generation.
			return false;
		}

		var gen = this.generations[this.generations.length - 1]
			.generateNextGeneration();
		this.generations.push(new Generation());
		return gen;
	}

	/**
	 * Add a genome to the Generations.
	 *
	 * @param {genome}
	 * @return False if no Generations to add to.
	 */
	Generations.prototype.addGenome = function (genome) {
		// Can't add to a Generation if there are no Generations.
		if (this.generations.length == 0) return false;

		// FIXME addGenome returns void.
		return this.generations[this.generations.length - 1].addGenome(genome);
	}


	/*SELF************************************************************************/
	self.generations = new Generations();

	/**
	 * Reset and create a new Generations object.
	 *
	 * @return void.
	 */
	self.restart = function () {
		self.generations = new Generations();
	}

	/**
	 * Create the next generation.
	 *
	 * @return Neural Network array for next Generation.
	 */
	self.nextGeneration = function () {
		var networks = [];

		if (self.generations.generations.length == 0) {
			// If no Generations, create first.
			networks = self.generations.firstGeneration();
		} else {
			// Otherwise, create next one.
			networks = self.generations.nextGeneration();
		}

		// Create Networks from the current Generation.
		var nns = [];
		for (var i in networks) {
			var nn = new Network();
			nn.setSave(networks[i]);
			nns.push(nn);
		}

		if (self.options.lowHistoric) {
			// Remove old Networks.
			if (self.generations.generations.length >= 2) {
				var genomes =
					self.generations
					.generations[self.generations.generations.length - 2]
					.genomes;
				for (var i in genomes) {
					delete genomes[i].network;
				}
			}
		}

		if (self.options.historic != -1) {
			// Remove older generations.
			if (self.generations.generations.length > self.options.historic + 1) {
				self.generations.generations.splice(0,
					self.generations.generations.length - (self.options.historic + 1));
			}
		}

		return nns;
	}

	/**
	 * Adds a new Genome with specified Neural Network and score.
	 *
	 * @param {network} Neural Network.
	 * @param {score} Score value.
	 * @return void.
	 */
	self.networkScore = function (network, score) {
		self.generations.addGenome(new Genome(score, network.getSave()));
	}
}
