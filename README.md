# node-red-contrib-trello-functions

This is my first node project, the idea is to have very easy 
and simple to use node functions that capture meaningful Trello events.

As this is my first project I am a little unsure where to take this, 
so I am very open to any suggestions or help and it will be greatly appreciated.


## Current nodes 

* ### New Trello card

Outputs a Trello card for every new card added  as msg.payload.

Output is time bounded between the previous and current activation.

Boolean option to exclude any actions performed by the owner of the API key.

* ### Assigned to Trello card

Outputs a Trello card for every card the Trello user is assigned to as msg.payload.

Output is time bounded between the previous and current activation.

Boolean option to exclude any actions performed by the owner of the API key.

* ### Get card moved lists

Outputs a Trello card that has moved Trello list as msg.payload.

Output is time bounded between the previous and current activation.

Boolean option to exclude any actions performed by the owner of the API key.

* ### Get card moved to list

Outputs a Trello card that has moved to a specific Trello list as msg.payload.

Output is time bounded between the previous and current activation.

Boolean option to exclude any actions performed by the owner of the API key.

* ### Create new Trello card

Able to create an array of Trello cards based on input, with optional default values 
available.

* ### Add Label to Trello Card

Adds a predefined label to a Trello card.

* ### If card in list

Simple helper by means of a drop down list select, with 2 outputs 1 for True the other 
for False.

* ### Meaningful card position

Simple helper that calculates an incremental positional value starting at 1 for the top card,
also has a separate output if it is the top or bottom card.


## Current plans to implement
* Adding a whitelist/blacklist of users to allow filtering by users
* Considering changing the nodes from function nodes to output nodes
* Currently taking suggestions on other nodes.
