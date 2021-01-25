import React, { useState, useEffect } from 'react';
import './App.css';
import { API, Storage } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listRecipes } from './graphql/queries';
import { createRecipe as createRecipeMutation, deleteRecipe as deleteRecipeMutation } from './graphql/mutations';

const initialFormState = { title: '', description: '' , ingredList: '', steps: ''}

function App() {
  const [recipes, setRecipes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchRecipes();
  }, []);

  async function fetchRecipes() {
    const apiData = await API.graphql({ query: listRecipes });
    const recipesFromAPI = apiData.data.listRecipes.items;
    await Promise.all(recipesFromAPI.map(async recipe => {
      if (recipe.image) {
        const image = await Storage.get(recipe.image);
        recipe.image = image;
      }
      return recipe;
    }))


    setRecipes(apiData.data.listRecipes.items);
  }

  async function createRecipe() {
    if (!formData.title || !formData.description) return;
    await API.graphql({ query: createRecipeMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setRecipes([ ...recipes, formData ]);
    setFormData(initialFormState);
  }

  async function deleteRecipe({ id }) {
    const newRecipesArray = recipes.filter(recipe => recipe.id !== id);
    setRecipes(newRecipesArray);
    await API.graphql({ query: deleteRecipeMutation, variables: { input: { id } }});
  }

  return (
    <div className="App">
      <h1>My Recipe List</h1>
      <input
        onChange={e => setFormData({ ...formData, 'title': e.target.value})}
        placeholder="Recipe name"
        value={formData.name}
      />
      <input
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Recipe description"
        value={formData.description}
      />
      <input
        onChange={e => setFormData({ ...formData, 'ingredList': e.target.value})}
        placeholder="Ingredients and Amounts"
        value={formData.ingredList}
      />
      <input
        onChange={e => setFormData({ ...formData, 'steps': e.target.value})}
        placeholder="Steps"
        value={formData.steps}
      />
      <input
        type="file"
        onChange={onChange}
      />
      <button onClick={createRecipe}>Create Recipe</button>
      <div style={{marginBottom: 30}}>
        {
          recipes.map(recipe => (
            <div key={recipe.id || recipe.title}>
              <h2>{recipe.title}</h2>
              <p>{recipe.description}</p>
              <p>{recipe.ingredList}</p>
              <p>{recipe.steps}</p>
              <button onClick={() => deleteRecipe(recipe)}>Delete Recipe</button>
              {
                recipe.image && <img src={recipe.image} style={{width: 400}} alt="test" />
              }
            </div>
          ))
        }
      </div>
      <AmplifySignOut />
    </div>
  );

  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchRecipes();
  }
}

export default withAuthenticator(App);