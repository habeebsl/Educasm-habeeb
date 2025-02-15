import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { ExploreView } from './components/Explore/ExploreView';
import { PlaygroundView } from './components/Playground/PlaygroundView';
import { ReviewMistakes } from './components/Review/ReviewMistakesView';
import { Loading } from './components/shared/Loading';
import { PreFillForm } from './components/shared/PreFillForm';
import storageService from './services/storageService';
import { Toaster, toast } from 'react-hot-toast';
import { GoogleTagManager } from './components/shared/GoogleTagManager';
import { UserContext } from './types';

function App() {
  // localStorage.clear()
  const [userContext, setUserContext] = useState<UserContext | null>(storageService.getUserInfo());
  const [isLoading, setIsLoading] = useState(false)
  const handleError = (message: string) => {
    toast.error(message);
  };

  const handleSuccess = (message: string) => {
    toast.success(message);
  };

  const handleSubmit = async (context: UserContext) => {
    setIsLoading(true)
    try {
      storageService.saveUserInfo(context)
      setUserContext(context)
    } catch (error) {
      console.error("Error saving user info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userContext) {
    return isLoading ? (
      <div className="flex justify-center py-12">
        <Loading size="lg" />
      </div>
    ) : (
      <div className="min-h-screen bg-background text-white p-4">
        <PreFillForm onSubmit={(context) => handleSubmit(context)} />
      </div>
    );
  }

  return (
    <Router>
      <GoogleTagManager />
      <div className="min-h-screen bg-background text-white">
        <Toaster position="top-right" />
        <Layout>
          <Routes>
            <Route 
              path="/" 
              element={
                <ExploreView 
                  onError={handleError}
                  userContext={userContext}
                />
              } 
            />
            <Route 
              path="/playground" 
              element={
                <PlaygroundView 
                  onError={handleError}
                  onSuccess={handleSuccess}
                  userContext={userContext}
                />
              } 
            />
            <Route 
              path="/playground/review" 
              element={
                <ReviewMistakes/>
              } 
            />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
}

export default App;