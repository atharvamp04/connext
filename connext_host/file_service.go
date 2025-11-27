package main

import "log"

type FileService struct {
	// Will implement file transfer
}

func NewFileService() *FileService {
	return &FileService{}
}

func (f *FileService) ListFiles(path string) ([]string, error) {
	log.Printf("List files: %s", path)
	// TODO: Implement
	return nil, nil
}

func (f *FileService) ReadFile(path string) ([]byte, error) {
	log.Printf("Read file: %s", path)
	// TODO: Implement
	return nil, nil
}
