import * as React from 'react';
import {
  Theme,
  Flex,
  Grid,
  TextField,
  Text,
  Select,
  TextArea,
  Button,
  Container,
  Section,
  Card,
  IconButton,
  Heading,
} from '@radix-ui/themes';
import { SunIcon } from '@radix-ui/react-icons';

export default function Test() {
  return (
    <div id="root">
      <Container px="8">
      <Grid>
        <Flex>
          <Heading>Це заголовок</Heading>
          <Text>Текст пыд заголовок</Text>
        </Flex>
        <Flex>
          <Heading>Це заголовок</Heading>
          <Text>Текст пыд заголовок</Text>
        </Flex>
      </Grid>
      </Container>
    </div>
  );
}
