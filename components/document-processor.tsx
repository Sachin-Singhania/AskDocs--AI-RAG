"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Upload, Globe, Loader2, Sparkles, FileText, Link } from "lucide-react"
import { processFile, processUrl } from "@/lib/actions/file"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface DocumentProcessorProps {
  documentType: "pdf" | "url" | null
}

export function DocumentProcessor({ documentType }: DocumentProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [url, setUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const {data:session,status} = useSession();
  const nav= useRouter();
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
    if (status !== "authenticated" || !session?.user || !session?.user?.userId) {
      toast.success("Signin To Use our service")
        nav.push("/signup");
        return;
    }
  setIsProcessing(true);
  try {
    if (documentType === "pdf" && file) {
      const res = await processFile(file);
      if(res.status=="error"){
        toast.error(res.message);
        nav.push("/signup")
      }else{
        toast.success(res.message);
      }
    } 
    else if (documentType === "url" && url) {
      const res = await processUrl(url);
      console.log("URL processing result:", res);
      if(res.status=="error"){
        if(res.message=="User not found in database"){
          toast.error(res.message);
          nav.push("/signup")
        }
        if(res.message=="LimitExceededError"){
          toast.error("Your limit has been exceeded");
        }

      }else{
        toast.success(res.message);
      }
    }
  } catch (error) {
    console.error("Error processing document:", error);
    toast.error("Error processing document");
  } finally {
    setIsProcessing(false);
  }
};
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile)
      }
    }
  }, [])

    if (!documentType) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="p-12 max-w-lg text-center bg-white/70 backdrop-blur-sm border-white/20 shadow-2xl shadow-slate-200/20">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200/30 mb-4">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4"></div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Ready to Begin</h3>
          <p className="text-slate-600 leading-relaxed">
            Choose your document source from the sidebar to start an intelligent conversation with your content
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Card className="p-8 max-w-lg w-full bg-white/80 backdrop-blur-sm border-white/20 shadow-2xl shadow-slate-200/20">
        <div className="text-center mb-8">
          <div
            className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${
              documentType === "pdf"
                ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-200/30"
                : "bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-200/30"
            }`}
          >
            {documentType === "pdf" ? (
              <FileText className="h-8 w-8 text-white" />
            ) : (
              <Link className="h-8 w-8 text-white" />
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {documentType === "pdf" ? "Upload Your PDF" : "Enter Web URL"}
          </h3>
          <p className="text-slate-600 leading-relaxed">
            {documentType === "pdf"
              ? "Drop your PDF file here or click to browse and unlock AI-powered insights"
              : "Paste any web URL to extract and analyze its content with AI"}
          </p>
        </div>

        <div className="space-y-6">
          {documentType === "pdf" ? (
            <div>
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  dragActive
                    ? "border-blue-500 bg-blue-50/50"
                    : file
                      ? "border-green-400 bg-green-50/50"
                      : "border-slate-300 hover:border-blue-400 hover:bg-blue-50/30"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-3">
                  <div
                    className={`mx-auto w-12 h-12 rounded-lg flex items-center justify-center ${
                      file ? "bg-green-500" : "bg-slate-200"
                    }`}
                  >
                    <Upload className={`h-6 w-6 ${file ? "text-white" : "text-slate-500"}`} />
                  </div>
                  {file ? (
                    <div>
                      <p className="font-medium text-green-700">File Selected</p>
                      <p className="text-sm text-green-600">{file.name}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-slate-700">Drop PDF here or click to browse</p>
                      <p className="text-sm text-slate-500">Supports PDF files up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="url"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={handleURLUpload}
                  className="pl-11 h-12 bg-white/70 border-slate-200 focus:border-purple-400 focus:ring-purple-400/20"
                />
              </div>
              <p className="text-xs text-slate-500">Enter any web URL to extract and analyze its content</p>
            </div>
          )}

          <Button
          onClick={handleProcessClick}
            disabled={isProcessing || (!file && !url)}
            className={`w-full h-12 font-medium shadow-lg transition-all duration-200 ${
              documentType === "pdf"
                ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-200/30"
                : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-200/30"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span>Processing Document...</span>
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                <span>Process with AI</span>
              </>
            )}
          </Button>
        </div>
        {isProcessing && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200/50">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-700">Analyzing content and generating embeddings...</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
