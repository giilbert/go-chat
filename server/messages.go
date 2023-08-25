package main

import "github.com/google/uuid"

type Author struct {
	Id   uuid.UUID `json:"id"`
	Name string    `json:"name"`
}

type Out struct {
	Type string `json:"type"`
	Data any    `json:"data"`
}

type OutMessage struct {
	From    Author `json:"from"`
	Message string `json:"message"`
}

type OutId struct {
	Id uuid.UUID `json:"id"`
}

type In[T any] struct {
	Type string `json:"type"`
	Data T      `json:"data"`
}

type InHandshake struct {
	Name string `json:"name"`
}

type InSend struct {
	Message string `json:"message"`
}
