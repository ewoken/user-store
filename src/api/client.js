import fs from 'fs';
import Url from 'url';
import FormData from 'form-data'; // eslint-disable-line import/no-extraneous-dependencies

import fetchApi, { clearCookies } from '@ewoken/backend-common/lib/fetchApi';

// TODO make it reusable for front
// dev only routes ?
class Client {
  constructor(url, options) {
    this.url = url;
    this.hostname = Url.parse(url).hostname;
    this.options = options;
  }

  clearSession() {
    return clearCookies(this.hostname);
  }

  // =========================================
  // USER API

  signUp(user) {
    return fetchApi(`${this.url}/users/signUp`, {
      method: 'POST',
      body: JSON.stringify(user),
      ...this.options,
    });
  }

  logIn(credentials) {
    return fetchApi(`${this.url}/users/logIn`, {
      method: 'POST',
      body: JSON.stringify(credentials),
      ...this.options,
    });
  }

  logInWithToken(token) {
    return fetchApi(`${this.url}/users/logInWithToken`, {
      method: 'POST',
      body: JSON.stringify({ token }),
      ...this.options,
    });
  }

  getMe() {
    return fetchApi(`${this.url}/users/me`, {
      method: 'GET',
      ...this.options,
    });
  }

  getUser(id) {
    return fetchApi(`${this.url}/users/${id}`, {
      method: 'GET',
      ...this.options,
    });
  }

  updateUser(id, updates) {
    return fetchApi(`${this.url}/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
      ...this.options,
    });
  }

  logOut() {
    return fetchApi(`${this.url}/users/logOut`, {
      method: 'POST',
      ...this.options,
    });
  }

  deleteAllUsers() {
    return fetchApi(`${this.url}/users`, {
      method: 'DELETE',
      ...this.options,
    });
  }

  generateAuthToken(userId) {
    return fetchApi(`${this.url}/users/generateToken/${userId}`, {
      method: 'POST',
      ...this.options,
    });
  }

  // =========================================
  // FILE API

  addFiles(filePaths) {
    const form = new FormData();
    filePaths.forEach(filePath =>
      form.append('files', fs.createReadStream(filePath)),
    );

    return fetchApi(`${this.url}/files/`, {
      method: 'POST',
      body: form,
      ...this.options,
      headers: { 'Content-Type': null, ...this.options.headers },
    });
  }

  getFile(fileId) {
    return fetchApi(`${this.url}/files/${fileId}`, this.options);
  }

  getMetadata(fileIds) {
    return fetchApi(`${this.url}/files/getMetadata`, {
      method: 'POST',
      body: JSON.stringify(fileIds),
      ...this.options,
    });
  }

  setDomainType(args) {
    return fetchApi(`${this.url}/files/setDomainType`, {
      method: 'POST',
      body: JSON.stringify(args),
      ...this.options,
    });
  }

  deleteFiles(fileIds) {
    return fetchApi(`${this.url}/files/`, {
      method: 'DELETE',
      body: JSON.stringify(fileIds),
      ...this.options,
    });
  }

  deleteAllFiles() {
    return fetchApi(`${this.url}/files/*`, {
      method: 'DELETE',
    });
  }
}

export default Client;
