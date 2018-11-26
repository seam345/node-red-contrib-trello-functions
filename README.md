# node-red-contrib-trello-functions

This is my first node project, the idea is to have very easy 
and simple to use node functions that capture meaningful Trello events.

As this is my first project I am a little unsure where to take this, 
so I am very open to any suggestions or help and it will be greatly appreciated.


## Current nodes 

* ### New Trello card

Outputs a Trello card as msg.payload for every new card added to Trello between 
the previous and current activation of the node.

* ### Assigned to Trello card

Outputs a Trello card as msg.payload for every card the Trello user is assigned to between 
the previous and current activation of the node.

* ### Get card moved lists

Outputs a Trello card as msg.payload for every card moved between Trello list between 
the previous and current activation of the node.


## Current plans to implement
* A function node to detect a card moving between lists.
* Also taking suggestions on other nodes.