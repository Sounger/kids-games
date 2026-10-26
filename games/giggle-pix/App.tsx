import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { StyleSelector } from './components/StyleSelector';
import { Button } from './components/Button';
import { AppState, FunStyle, GeneratedImage } from './types';
import { generateFunnyImage } from './services/photoEffects';
import { LOADING_MESSAGES } from './constants';
import { Camera, Upload, RotateCw, Download, Sparkles, X } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<FunStyle | null>(null);
  const [resultImage, setResultImage] = useState<GeneratedImage | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cycle loading messages
  useEffect(() => {
    let interval: number;
    if (appState === AppState.GENERATING) {
      interval = window.setInterval(() => {
        setLoadingMsg(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [appState]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setAppState(AppState.PREVIEW);
        setErrorMsg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleGenerate = async () => {
    if (!selectedImage || !selectedStyle) return;

    setAppState(AppState.GENERATING);
    setErrorMsg(null);

    try {
      const generatedBase64 = await generateFunnyImage(selectedImage, selectedStyle.id);
      setResultImage({
        original: selectedImage,
        result: generatedBase64,
        styleName: selectedStyle.name
      });
      setAppState(AppState.SUCCESS);
    } catch (error) {
      console.error(error);
      setErrorMsg("Oops! The fun machine got jammed. Try a different photo!");
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setSelectedImage(null);
    setSelectedStyle(null);
    setResultImage(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage.result;
      link.download = `gigglepix-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Rendering Helper: Loading Screen
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-12 animate-pulse">
      <div className="w-32 h-32 bg-kid-yellow rounded-full flex items-center justify-center border-4 border-black mb-6 animate-bounce">
        <Sparkles size={48} className="text-black animate-spin-slow" />
      </div>
      <h3 className="text-2xl font-bold text-center text-kid-purple mb-2">{loadingMsg}</h3>
      <p className="text-gray-500">Please wait a moment...</p>
    </div>
  );

  // Rendering Helper: Success Screen
  const renderSuccess = () => (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto animate-fade-in-up">
      <div className="bg-white p-4 rounded-3xl border-4 border-black shadow-comic w-full mb-8 relative">
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-kid-yellow px-6 py-2 rounded-full border-2 border-black z-10">
          <span className="font-bold text-lg">✨ Ta-daaa! ✨</span>
        </div>
        
        <div className="flex flex-col items-center p-2">
            <img 
                src={resultImage?.result} 
                alt="Funny Result" 
                className="w-full h-auto max-h-[500px] object-contain rounded-2xl border-4 border-kid-blue shadow-lg"
            />
            <h3 className="mt-4 text-3xl font-black text-kid-purple tracking-wide transform -rotate-1">
               {resultImage?.styleName} Magic!
            </h3>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <Button onClick={handleDownload} className="flex items-center justify-center gap-2">
          <Download size={20} /> Save Picture
        </Button>
        <Button variant="secondary" onClick={handleReset} className="flex items-center justify-center gap-2">
          <RotateCw size={20} /> Do Another!
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pb-12">
      <Header />

      <main className="container mx-auto px-4 max-w-5xl">
        
        {/* Error Message */}
        {errorMsg && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r shadow-sm flex justify-between items-center">
             <p className="font-bold">{errorMsg}</p>
             <button onClick={() => setErrorMsg(null)}><X size={20}/></button>
          </div>
        )}

        {/* State: IDLE - Upload Area */}
        {appState === AppState.IDLE && (
          <div className="flex flex-col items-center justify-center mt-8">
            <div 
              onClick={triggerFileUpload}
              className="w-full max-w-xl aspect-video bg-white border-4 border-dashed border-kid-blue rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 transition-colors group p-8"
            >
              <div className="bg-kid-blue p-6 rounded-full border-2 border-black mb-4 group-hover:scale-110 transition-transform">
                <Upload size={40} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">Click to Upload Photo</h3>
              <p className="text-gray-500 text-center">Take a selfie or pick a photo from your gallery!</p>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
            />
            
            <div className="mt-8 flex gap-4 text-gray-400">
               <span className="flex items-center gap-1"><Camera size={16}/> Safe</span>
               <span className="flex items-center gap-1"><Sparkles size={16}/> Fast</span>
               <span className="flex items-center gap-1"><RotateCw size={16}/> Fun</span>
            </div>
          </div>
        )}

        {/* State: PREVIEW - Show Image & Styles */}
        {(appState === AppState.PREVIEW || appState === AppState.ERROR) && selectedImage && (
          <div className="animate-fade-in-up">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              
              {/* Left Col: Preview */}
              <div className="w-full md:w-1/3 flex flex-col gap-4">
                <div className="bg-white p-3 rounded-3xl border-2 border-black shadow-comic transform -rotate-1">
                  <img 
                    src={selectedImage} 
                    alt="Preview" 
                    className="w-full h-auto rounded-2xl"
                  />
                </div>
                <Button variant="secondary" onClick={handleReset} fullWidth>
                   Change Photo
                </Button>
              </div>

              {/* Right Col: Style Selector */}
              <div className="w-full md:w-2/3">
                 <StyleSelector 
                    selectedId={selectedStyle?.id || null} 
                    onSelect={setSelectedStyle} 
                    disabled={false}
                 />
                 
                 <div className="mt-8">
                   <Button 
                      onClick={handleGenerate} 
                      disabled={!selectedStyle} 
                      fullWidth 
                      className="text-xl py-4"
                   >
                     {selectedStyle ? `Go ${selectedStyle.name}!` : 'Pick a Style Above!'}
                   </Button>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* State: GENERATING */}
        {appState === AppState.GENERATING && renderLoading()}

        {/* State: SUCCESS */}
        {appState === AppState.SUCCESS && renderSuccess()}

      </main>
    </div>
  );
};

export default App;