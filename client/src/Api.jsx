import dayjs from "dayjs";

const URL = 'http://localhost:3001/api';

async function getAllPages() {
  // call  /api/pages
  const response = await fetch(URL + '/pages');
  const pages = await response.json();
  if (response.ok) {
    return pages.map((e) => ({ id: e.id, title: e.title, author: e.author, authorId: e.authorId, creationDate: dayjs(e.creationDate), publishDate: e.publishDate ? dayjs(e.publishDate) : '', blocks_array: e.blocks_array }))
  } else {
    throw pages;  // mi aspetto che sia un oggetto json fornito dal server che contiene l'errore
  }
}

async function getImages() {
  // call  /api/images
  const response = await fetch(URL + '/images');
  const images = await response.json();
  if (response.ok) {
    return images.map((e) => ({ id: e.id, imagePath: e.imagePath }))
  } else {
    throw images;
  }
}

async function getTitle() {
  // call  /api/title
  const response = await fetch(URL + '/title');
  const title = await response.json();
  if (response.ok) {
    const e = title;
    return { id: e.id, titleName: e.titleName };
  } else {
    throw title;
  }
}

async function getAuthors() {
  // call  /api/authors
  const response = await fetch(URL + '/authors');
  const authors = await response.json();
  if (response.ok) {
    return authors.map((e) => ({ id: e.id, email: e.email, name: e.name }))
  } else {
    throw authors;
  }
}

function addPage(page) {
  // call  POST /api/pages
  return new Promise((resolve, reject) => {
    fetch(URL + '/pages', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Object.assign({}, page, { creationDate: page.creationDate.format("YYYY-MM-DD"), publishDate: page.publishDate ? page.publishDate.format("YYYY-MM-DD") : '' })), //da cambiare
    }).then((response) => {
      if (response.ok) {
        response.json()
          .then((id) => resolve(id))
          .catch(() => { reject({ error: "Cannot parse server response." }) });
      } else {
        // analyze the cause of error
        response.json()
          .then((message) => { reject(message); }) // error message in the response body
          .catch(() => { reject({ error: "Cannot parse server response." }) }); // something else
      }
    }).catch(() => { reject({ error: "Cannot communicate with the server." }) }); // connection errors
  });
}


function deletePage(id) {
  // call  DELETE /api/pages/<id>
  return new Promise((resolve, reject) => {
    fetch(URL + `/pages/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    }).then((response) => {
      if (response.ok) {
        resolve(null);
      } else {
        // analyze the cause of error
        response.json()
          .then((message) => { reject(message); }) // error message in the response body
          .catch(() => { reject({ error: "Cannot parse server response." }) }); // something else
      }
    }).catch(() => { reject({ error: "Cannot communicate with the server." }) }); // connection errors
  });
}

function editPage(page) {
  // call  PUT /api/pages/<id>
  return new Promise((resolve, reject) => {
    fetch(URL + `/pages/${page.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Object.assign({}, page, { creationDate: page.creationDate.format("YYYY-MM-DD"), publishDate: page.publishDate ? page.publishDate.format("YYYY-MM-DD") : '' })),
    }).then((response) => {
      if (response.ok) {
        resolve(null);
      } else {
        // analyze the cause of error
        response.json()
          .then((message) => { reject(message); }) // error message in the response body
          .catch(() => { reject({ error: "Cannot parse server response." }) }); // something else
      }
    }).catch(() => { reject({ error: "Cannot communicate with the server." }) }); // connection errors
  });
}

function editTitle(title) {
  // call  PUT /api/title
  return new Promise((resolve, reject) => {
    fetch(URL + `/title`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Object.assign({}, title)),
    }).then((response) => {
      if (response.ok) {
        resolve(null);
      } else {
        // analyze the cause of error
        response.json()
          .then((message) => { reject(message); }) // error message in the response body
          .catch(() => { reject({ error: "Cannot parse server response." }) }); // something else
      }
    }).catch(() => { reject({ error: "Cannot communicate with the server." }) }); // connection errors
  });
}


async function logIn(credentials) {
  let response = await fetch(URL + '/sessions', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  if (response.ok) {
    const user = await response.json();
    return user;
  } else {
    const errDetail = await response.json();
    throw errDetail.message;
  }
}

async function logOut() {
  await fetch(URL + '/sessions/current', {
    method: 'DELETE',
    credentials: 'include'
  });
}

async function getUserInfo() {
  const response = await fetch(URL + '/sessions/current', {
    credentials: 'include'
  });
  const userInfo = await response.json();
  if (response.ok) {
    return userInfo;
  } else {
    throw userInfo;
  }
}


const API = {
  getAllPages, logIn, logOut, getUserInfo, addPage, deletePage, editPage, getImages, getAuthors, getTitle, editTitle
};
export default API;