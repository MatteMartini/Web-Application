import 'bootstrap/dist/css/bootstrap.min.css';
import { Container } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import dayjs from 'dayjs';
import CMS from './components/PrincipalRoute';
import FormRoute from './components/PageForm';
import PageVisualized from './components/PageView';
import { LoginForm } from './components/Login';
import API from './Api';
import NavBar from './components/Navbar';
//import './App.css'

function App() {
  const [pages, setPages] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dirty, setDirty] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [user, setUser] = useState(undefined);
  const [loggedIn, setLoggedIn] = useState(false);
  const [images, setImages] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [title, setTitle] = useState('');
  const [front, setFront] = useState(true);

  function handleError(err) {
    console.log('err: ' + JSON.stringify(err));  // Only for debug
    let errMsg = 'Unkwnown error';
    if (err.errors) {
      if (err.errors[0])
        if (err.errors[0].msg)
          errMsg = err.errors[0].msg;
    } else if (err.error) {
      errMsg = err.error;
    }
    setErrorMsg(errMsg);
    setTimeout(() => setDirty(true), 1000);  // Fetch correct version from server, after a while
  }


  useEffect(() => { //nuova funzione. Controlla funzione verifica se c'è un cookie valido, quindi se prima ero gia loggato
    const checkAuth = async () => {  //cosi non deve ricrearne un altro per un utente gia usato in passato
      try {
        // here you have the user info, if already logged in
        const user = await API.getUserInfo();
        setLoggedIn(true);
        setUser(user);
      } catch (err) { //entra in err se non trova nessun dato di uno user loggato.
        // NO need to do anything: user is simply not yet authenticated
        handleError(err);
      }
    };
    checkAuth();
  }, []);

  const doLogOut = async () => {
    await API.logOut();
    setLoggedIn(false);
    setUser(undefined);
  }

  const addPage = (page) => {
    page.authorId = user.name;
    API.addPage(page)
      .then(() => { setDirty(true); })
      .catch(e => handleError(e));
  }

  const deletePage = (pageId) => {
    API.deletePage(pageId)
      .then(() => { setDirty(true); })
      .catch(e => handleError(e));
  }

  const editPage = (page) => {
    API.editPage(page)
      .then(() => { setDirty(true); })
      .catch(e => handleError(e));
  }

  const editTitle = (title) => {
    API.editTitle(title)
      .then(() => { setDirty(true); })
      .catch(e => handleError(e));
  }

  useEffect(() => {
    if (dirty) {
      API.getImages().then((images) => {
        setImages(images);
      })
        .catch((error) => {
          handleError(error);
        });
    }
  }, []);

  useEffect(() => {
    if (dirty) {
      API.getTitle().then((title) => {
        setTitle(title);
      })
        .catch((error) => {
          handleError(error);
        });
    }
  }, [dirty]);

  useEffect(() => {
    if (user && user.administrator && dirty)
      API.getAuthors().then((autori) => {
        setAuthors(autori);
      })
        .catch((error) => {
          handleError(error);
        });
  }, [user]);

  const loginSuccessful = (user) => { //questo user è quello che mi ha risposto il server, e lo salvo in uno stato!
    setUser(user);
    setLoggedIn(true);
    setDirty(true);
  }

  useEffect(() => {
    if (dirty) {
      API.getAllPages()
        .then((pages) => {
          setPages(pages);
          setDirty(false);
          setInitialLoading(false);
        })
        .catch((err) => handleError(err));
    }
  }, [pages, dirty]);

  return (
    <BrowserRouter>
      <NavBar user={user} logout={doLogOut} title={title} editTitle={editTitle} front={front} setFront={setFront} />
      <Routes>
        <Route path='/' element={<CMS pages={pages} setPages={setPages} errorMsg={errorMsg} user={user}
          resetErrorMsg={() => setErrorMsg('')} initialLoading={initialLoading} loggedIn={loggedIn} deletePage={deletePage}
          editPage={editPage} addPage={addPage} front={front} setFront={setFront} />
        } />
        <Route path='/add' element={<FormRoute user={user} logout={doLogOut}
          addPage={addPage} pages={pages} images={images} authors={authors} />} />
        <Route path='/edit/:pageId' element={<FormRoute user={user} logout={doLogOut}
          pages={pages} addPage={addPage} editPage={editPage} images={images} authors={authors} />} />
        <Route path="/page/:pageId" element={<PageVisualized pages={pages} />} />
        <Route path='/login' element={loggedIn ? <Navigate replace to='/' /> : <LoginForm loginSuccessful={loginSuccessful} />} />
        <Route path='/*' element={<DefaultRoute />} />
      </Routes>
    </BrowserRouter>

  )
}

function DefaultRoute() {
  return (
    <Container className='App'>
      <h1>No data here...</h1>
      <h2>This is not the route you are looking for!</h2>
      <Link to='/'>Please go back to main page</Link>
    </Container>
  );
}

export default App
