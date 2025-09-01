package handlers

import "github.com/google/uuid"

type CommonInfoResponse struct {
	Code int    `json:"code"`
	Msg  string `json:"msg"`
}

type CommonDataResponse struct {
	Code int         `json:"code"`
	Msg  string      `json:"msg"`
	Data interface{} `json:"data"`
}

func commonSucResp(data interface{}, msg string) *CommonDataResponse {
	return &CommonDataResponse{
		Code: 200,
		Msg:  msg,
		Data: data,
	}
}

func clientErrResp(code int, msg string) *CommonInfoResponse {
	return &CommonInfoResponse{
		Code: code,
		Msg:  msg,
	}
}

func serverErrResp(msg string) *CommonInfoResponse {
	return &CommonInfoResponse{
		Code: 500,
		Msg:  msg,
	}
}

func GenerateTraceID() string {
	return uuid.New().String()
}
