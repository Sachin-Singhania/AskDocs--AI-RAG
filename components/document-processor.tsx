"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Upload, Globe, Loader2 } from "lucide-react"
import { processFile, processUrl } from "@/lib/actions/file"

interface DocumentProcessorProps {
  documentType: "pdf" | "url" | null
}

export function DocumentProcessor({ documentType }: DocumentProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [url, setUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile)
    }
  }
  const handleURLUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputUrl = event.target.value;
    setUrl(inputUrl)
  }
  const handleProcessClick = async () => {
  setIsProcessing(true);
  try {
    if (documentType === "pdf" && file) {
      const res = await processFile(file);
      console.log("File processing result:", res);
    } 
    else if (documentType === "url" && url) {
      const res = await processUrl(url);
      console.log("URL processing result:", res);
    }
  } catch (error) {
    console.error("Error processing document:", error);
  } finally {
    setIsProcessing(false);
  }
};

  if (!documentType) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <div className="mb-4">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Upload className="h-6 w-6 text-gray-400" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Get Started</h3>
          <p className="text-gray-600">Select a document source from the sidebar to begin chatting with your content</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            {documentType === "pdf" ? (
              <Upload className="h-6 w-6 text-blue-600" />
            ) : (
              <Globe className="h-6 w-6 text-blue-600" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {documentType === "pdf" ? "Upload PDF" : "Enter URL"}
          </h3>
          <p className="text-gray-600">
            {documentType === "pdf"
              ? "Upload a PDF file to start chatting with its content"
              : "Enter a URL to extract and chat with web content"}
          </p>
        </div>

        <div className="space-y-4">
          {documentType === "pdf" ? (
            <div>
              <Input type="file" accept=".pdf" onChange={handleFileUpload} className="cursor-pointer" />
              {file && <p className="text-sm text-gray-600 mt-2">Selected: {file.name}</p>}
            </div>
          ) : (
            <Input
              type="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={handleURLUpload}
            />
          )}

          <Button
            disabled={isProcessing || (documentType === "pdf" && !file) || (documentType === "url" && !url)}
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleProcessClick}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Process Document"
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}
