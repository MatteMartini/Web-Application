import { Col, Container, Row, Button, Form, Table, Alert, CloseButton } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import dayjs from 'dayjs';

const path = "http://localhost:3001";

function FormRoute(props) {
  return (
    <>
      <Container fluid>
        <FormPage pages={props.pages} addPage={props.addPage} user={props.user} editPage={props.editPage} images={props.images} authors={props.authors}
        />
      </Container>
    </>
  );
}

function FormPage(props) {
  const navigate = useNavigate();
  const { pageId } = useParams();  //con la edit

  const objToEdit = pageId && props.pages.find(e => e.id === parseInt(pageId));
  const authors = props.user.administrator ? props.authors : [];

  const [title, setTitle] = useState(objToEdit ? objToEdit.title : '');
  const [authorId, setAuthorId] = useState(objToEdit ? objToEdit.authorId : props.user.id);
  const [createDate, setCreateDate] = useState(objToEdit ? dayjs(objToEdit.creatingDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'));
  const [publicDate, setPublicDate] = useState(objToEdit && objToEdit.publishDate ? dayjs(objToEdit.publishDate).format('YYYY-MM-DD') : '');
  const [blocchi, setBlocchi] = useState(objToEdit ? objToEdit.blocks_array : []);
  const [errorMsg, setErrorMsg] = useState('');

  const [header, setHeader] = useState('');
  const [paragrafo, setParagrafo] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const [showFormHeader, setShowFormHeader] = useState(false);
  const [showFormParagrafo, setShowFormParagrafo] = useState(false);
  const [showFormImmagine, setShowFormImmagine] = useState(false);

  const handleAuthorChange = (event) => {
    const selectedAuthorEmail = event.target.value;
    const selectedAuthor = authors.find((author) => author.email === selectedAuthorEmail);
    setAuthorId(selectedAuthor.id);
    if (objToEdit) {
      objToEdit.author = selectedAuthor.name;
      objToEdit.authorId = selectedAuthor.id;
    }
  };

  const handleImageSelection = (image) => {
    setSelectedImage(image);
  };

  useEffect(() => {
    if (selectedImage) {
      addImmagine();
    }
  }, [selectedImage]);

  const scambiaOrdine = (indexA, indexB) => {
    setBlocchi((prevBlocchi) => {
      const updatedBlocchi = [...prevBlocchi];
      const temp = updatedBlocchi[indexA];
      updatedBlocchi[indexA] = updatedBlocchi[indexB];
      updatedBlocchi[indexB] = temp;
      return updatedBlocchi.map((blocco, index) => ({
        ...blocco,
        orderIndex: index + 1
      }));
    });
  };

  const addHeader = () => {
    const maxIndex = blocchi.length > 0 ? blocchi.reduce((max, obj) => Math.max(max, obj.orderIndex) + 1, blocchi[0].orderIndex) : 1;
    const idPagina = objToEdit ? pageId : Math.max(...props.pages.map(obj => obj.id)) + 1;
    const newBlock = {
      pageId: idPagina,
      type: 'header',
      orderIndex: maxIndex,
      content: header,
      imagePath: '',
    };
    setHeader('');
    setBlocchi([...blocchi, newBlock]);
  }

  const addParagrafo = () => {
    const maxIndex = blocchi.length > 0 ? blocchi.reduce((max, obj) => Math.max(max, obj.orderIndex) + 1, blocchi[0].orderIndex) : 1;
    const idPagina = objToEdit ? pageId : Math.max(...props.pages.map(obj => obj.id)) + 1;
    const newBlock = {
      pageId: idPagina,
      type: 'paragraph',
      orderIndex: maxIndex,
      content: paragrafo,
      imagePath: '',
    };
    setParagrafo('');
    setBlocchi([...blocchi, newBlock]);
  };

  const addImmagine = () => {
    if (selectedImage) {
      const maxIndex = blocchi.length > 0 ? Math.max(...blocchi.map((blocco) => blocco.orderIndex)) + 1 : 1;
      const idPagina = objToEdit ? pageId : Math.max(...props.pages.map((obj) => obj.id)) + 1;
      const newBlock = {
        pageId: idPagina,
        type: 'image',
        orderIndex: maxIndex,
        content: '',
        imagePath: selectedImage.imagePath,
      };
      setBlocchi([...blocchi, newBlock]);
      setSelectedImage(null);
      setShowFormImmagine(false);
    }
  };

  const rimuoviBlocco = (orderIndex) => {
    setBlocchi((prevBlocchi) =>
      prevBlocchi
        .filter((blocco) => blocco.orderIndex !== orderIndex)
        .map((blocco) =>
          blocco.orderIndex > orderIndex
            ? { ...blocco, orderIndex: blocco.orderIndex - 1 }
            : blocco
        )
    );
  };

  function handleSubmit(event) {
    event.preventDefault();

    if (createDate === '')
      setErrorMsg('Data non valida');
    else if (title === '')
      setErrorMsg('Inserire un titolo');
    else if (!blocchi.some(x => x.type === 'header'))
      setErrorMsg('Inserire almeno un header');
    else if (!(blocchi.some(x => x.type === 'paragraph') || blocchi.some(x => x.type === 'image')))
      setErrorMsg('Inserire almeno un blocco paragrafo o immagine');
    else if (dayjs(createDate).isAfter(publicDate)) {
      setErrorMsg(`Non puoi pubblicare una pagina prima di averla creata!`);
    }
    else {
      const p = {
        title: title,
        authorId: authorId,
        creationDate: dayjs(createDate),
        publishDate: publicDate ? dayjs(publicDate) : '',
        blocks_array: blocchi
      }

      if (objToEdit) {  // decide if this is an edit or an add
        p.id = objToEdit.id;
        props.editPage(p);
      } else {
        props.addPage(p);
      }
      navigate('/');
    }
  }

  return (
    <>
      {errorMsg ? <Alert variant='danger' onClose={() => setErrorMsg('')} dismissible>{errorMsg}</Alert> : false}
      <Form onSubmit={handleSubmit}>

        <Form.Group className='mb-3'>
          <Form.Label>Title</Form.Label>
          <Form.Control type="text" name="title" value={title} onChange={ev => setTitle(ev.target.value)} />
        </Form.Group>

        <p>Data di creazione : {dayjs(createDate).format('YYYY-MM-DD')}</p>

        <p>Autore : {objToEdit ? objToEdit.author : props.user.name}</p>

        {(props.user.administrator && objToEdit) ?
          <Form.Group className='mb-3'>
            <Form.Label>Cambia Autore</Form.Label>
            <Form.Select value={authors.find((author) => author.name === objToEdit.author).email} onChange={handleAuthorChange}>
              {authors.map((author) => (
                <option key={author.id} value={author.email}>
                  {author.email}
                </option>))}
            </Form.Select>
          </Form.Group>
          : null}

        <Form.Group className='mb-3'>
          <Form.Label>publishDate</Form.Label>
          <Form.Control type="date" name="publicDate" value={publicDate} onChange={ev => setPublicDate(ev.target.value)} />
        </Form.Group>

        {showFormHeader ?
          <Form.Group className='mb-3'>
            <Form.Label>Header</Form.Label>
            <Form.Control type="text" name="header" value={header} onChange={ev => setHeader(ev.target.value)} />
            <Button className='mt-2' variant='primary' onClick={() => { addHeader(); setShowFormHeader(false); }}>+</Button>
          </Form.Group>
          : null}

        {showFormParagrafo ?
          <Form.Group className='mb-3'>
            <Form.Label>Paragrafo</Form.Label>
            <Form.Control type="text" name="paragrafo" value={paragrafo} onChange={ev => setParagrafo(ev.target.value)} />
            <Button className='mt-2' variant='primary' onClick={() => { addParagrafo(); setShowFormParagrafo(false); }}>+</Button>
          </Form.Group>
          : null}

        {showFormImmagine ? (
          <div className="image-selector">
            {props.images.map((image) => (
              <img
                key={image.id}
                src={path + image.imagePath}
                alt="Image"
                onClick={() => handleImageSelection(image)}
              />
            ))}
          </div>
        ) : null}

        {blocchi ? (
          <div className="blocchi-container">
            {blocchi.sort((a, b) => a.orderIndex - b.orderIndex).map((blocco, index) => {
              return (
                <div key={blocco.orderIndex} className="blocco">
                  {blocco.type === 'header' && <h1>{blocco.content}</h1>}
                  {blocco.type === 'paragraph' && <p>{blocco.content}</p>}
                  {blocco.type === 'image' && (
                    <img src={path + blocco.imagePath} alt="Immagine" className="image-block" />
                  )}
                  <span className="elimina-blocco">
                    {index > 0 && (
                      <Button variant='secondary' className='arrow-button' onClick={() => scambiaOrdine(index, index - 1)}>
                        <i className="bi bi-arrow-up"></i>
                      </Button>
                    )}
                    {index < blocchi.length - 1 && (
                      <Button variant='secondary' className='arrow-button' onClick={() => scambiaOrdine(index, index + 1)}>
                        <i className="bi bi-arrow-down"></i>
                      </Button>
                    )}
                    <span className="x" onClick={() => rimuoviBlocco(blocco.orderIndex)}>
                      &#x00D7;
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}

        <Row>
          <Col>
            <Button className='mx-2 mt-3' variant='info' onClick={() => setShowFormHeader(true)}>Aggiungi header</Button>
          </Col>
          <Col>
            <Button className='mx-2 mt-3' variant='info' onClick={() => setShowFormParagrafo(true)}>Aggiungi paragrafo</Button>
          </Col>
          <Col>
            <Button className='mx-2 mt-3' variant='info' onClick={() => setShowFormImmagine(true)}>Aggiungi immagine</Button>
          </Col>
        </Row>

        <Row>
          <Col>
            <Button className='mx-2 mt-5' type='submit' variant="primary" onClick={(event) => handleSubmit(event)}>{objToEdit ? 'Salva pagina' : 'Aggiungi pagina'}</Button>
          </Col>
          <Col>
            <Button className='mx-2 mt-5' variant='danger' onClick={() => navigate('/')}>Cancel</Button>
          </Col>
          <Col></Col>
        </Row>
      </Form>
    </>
  );
}

export default FormRoute;