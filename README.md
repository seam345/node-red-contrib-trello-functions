# node-red-contrib-trello-functions

This is my first node project, the idea is to have very easy 
and simple to use node functions that capture meaningful Trello events.

As this is my first project I am a little unsure where to take this, 
so I am very open to any suggestions or help and it will be greatly appreciated.


## Current nodes 

* ### New Trello card

Outputs a Trello card for every new card added  as msg.payload.

Output is time bounded between the previous and current activation.

* ### Assigned to Trello card

Outputs a Trello card for every card the Trello user is assigned to as msg.payload.

Output is time bounded between the previous and current activation.

* ### Get card moved lists

Outputs a Trello card that has moved Trello list as msg.payload.

Output is time bounded between the previous and current activation.

### Exclude self

All nodes have a boolean option to exclude any actions performed by the owner of 
the API key.


## Current plans to implement
* Create a moved to list node to fire whenever a card is moved to a particular list
* Considering changing the nodes from function nodes to output nodes
* Currently taking suggestions on other nodes.
