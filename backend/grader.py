import os
import json
import base64
from typing import Optional, List
from google import genai
from google.genai import types
from dotenv import load_dotenv

from models import GradingResponse

class IELTSTask2Grader:
    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-3-flash-preview"):
        load_dotenv(os.path.join(os.path.dirname(__file__), "../.env.local"))
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment or provided.")
        
        self.client = genai.Client(api_key=self.api_key)
        self.model_name = model_name
        

    def __call__(self, task: str, essay_text: str) -> GradingResponse:
        contents = []
        prompt = self._get_instruction(task=task, essay=essay_text)
        contents.append(prompt)

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GradingResponse
            )
        )

        result_dict = json.loads(response.text)
        # Ensure task_type is set for the pydantic model
        result_dict["task_type"] = "task2"
        
        return GradingResponse(**result_dict)

    def _get_instruction(self, task: str, essay: str) -> str:

        IELTS_rule = f"""
        ## Criterion 1: Task Response (TR)

        Assess how fully and appropriately the candidate addresses the prompt, develops a position, and supports ideas with relevant arguments and evidence.

        | Band | Descriptor |
        |------|------------|
        | **9** | Prompt appropriately addressed and explored in depth. Clear and fully developed position directly answers the question(s). Ideas relevant, fully extended, and well supported. Lapses in content or support extremely rare. |
        | **8** | Prompt appropriately and sufficiently addressed. Clear and well-developed position presented. Ideas relevant, well extended, and supported. Occasional omissions or lapses in content. |
        | **7** | Main parts of the prompt appropriately addressed. Clear and developed position presented. Main ideas extended and supported, but may have a tendency to over-generalise or lack focus and precision in supporting ideas/material. |
        | **6** | Main parts of the prompt addressed (though some more fully than others). Appropriate format used. Position directly relevant to the prompt, though conclusions may be unclear, unjustified, or repetitive. Main ideas relevant but some insufficiently developed or lacking clarity; some supporting arguments/evidence may be less relevant or inadequate. |
        | **5** | Main parts of the prompt **incompletely addressed**. Format may be inappropriate in places. Writer expresses a position but development not always clear. Some main ideas put forward but limited and insufficiently developed; irrelevant detail possible. Some repetition. |
        | **4** | Prompt tackled minimally or answer is tangential, possibly due to misunderstanding. **Format may be inappropriate**. Position discernible but reader has to read carefully to find it. Main ideas difficult to identify; identifiable ideas may lack relevance, clarity, and/or support. **Large parts of the response may be repetitive**. |
        | **3** | No part of the prompt adequately addressed or prompt misunderstood. No relevant position identifiable; little direct response to the question(s). Few ideas; may be irrelevant or insufficiently developed. |
        | **2** | Content barely related to the prompt. No position identifiable. Glimpses of one or two ideas without development. |
        | **1** | Responses of 20 words or fewer. Content wholly unrelated to the prompt. Any copied rubric discounted. |
        | **0** | Candidate did not attend/attempt; used a language other than English; or response is proven to be totally memorised. |

        ---

        ## Criterion 2: Coherence & Cohesion (CC)

        Assess the logical organisation of information and ideas, sequencing, use of cohesive devices, referencing, substitution, and paragraphing.

        | Band | Descriptor |
        |------|------------|
        | **9** | Message followed effortlessly. Cohesion very rarely attracts attention. Any lapses minimal. Paragraphing skilfully managed. |
        | **8** | Message followed with ease. Information and ideas logically sequenced; cohesion well managed. Occasional lapses in coherence and cohesion. Paragraphing used sufficiently and appropriately. |
        | **7** | Information and ideas logically organised; clear progression throughout. A few minor lapses may occur. Range of cohesive devices (including reference and substitution) used flexibly but with some inaccuracies or over/under use. Paragraphing generally used effectively to support coherence; sequencing of ideas within paragraphs generally logical. |
        | **6** | Information and ideas generally arranged coherently with clear overall progression. Cohesive devices used to some good effect, but cohesion within/between sentences may be **faulty or mechanical** due to misuse, overuse, or omission. Reference and substitution may lack flexibility/clarity, causing some repetition or error. **Paragraphing may not always be logical and/or the central topic may not always be clear**. |
        | **5** | Organisation evident but **not wholly logical**; may lack overall progression. Sense of underlying coherence. Ideas can be followed but sentences not fluently linked. Limited/overuse of cohesive devices with some inaccuracy. Writing may be repetitive due to inadequate or inaccurate reference/substitution. **Paragraphing may be inadequate or missing**. |
        | **4** | Ideas evident but not arranged coherently; no clear progression. Relationships between ideas unclear and/or inadequately marked. Some basic cohesive devices, possibly inaccurate or repetitive. Inaccurate use or lack of substitution/referencing. **May be no paragraphing and/or no clear main topic within paragraphs**. |
        | **3** | No apparent logical organisation. Ideas discernible but difficult to relate. Minimal use of sequencers/cohesive devices; those used do not indicate logical relationships. Difficulty identifying referencing. Any attempts at paragraphing are unhelpful. |
        | **2** | **Little relevant message or entire response off-topic**. Little evidence of control of organisational features. |
        | **1** | Writing fails to communicate any message; appears to be by a virtual non-writer. |
        | **0** | See Band 0 above. |

        ---

        ## Criterion 3: Lexical Resource (LR)

        Assess the range, accuracy, and appropriacy of vocabulary, including spelling and word formation.

        | Band | Descriptor |
        |------|------------|
        | **9** | Full flexibility and precise use widely evident. Wide range of vocabulary used accurately and appropriately with very natural and sophisticated control of lexical features. Spelling/word formation errors extremely rare with minimal impact. |
        | **8** | Wide resource fluently and flexibly used to convey precise meanings. Skilful use of uncommon/idiomatic items when appropriate, despite occasional inaccuracies in word choice and collocation. Occasional spelling/word formation errors with minimal impact. |
        | **7** | Resource sufficient to allow some flexibility and precision. Some ability to use less common/idiomatic items. Awareness of style and collocation evident, though inappropriacies occur. Only a few spelling/word formation errors; do not detract from overall clarity. |
        | **6** | Resource generally adequate and appropriate. Meaning generally clear despite restricted range or lack of precision in word choice. Risk-takers may use a wider range but with higher inaccuracy. Some spelling/word formation errors but do not impede communication. |
        | **5** | Resource limited but minimally adequate. Simple vocabulary may be accurate but range does not allow much variation. Frequent lapses in word choice appropriacy; frequent simplifications/repetitions. Spelling/word formation errors may be noticeable and **may cause some difficulty for the reader**. |
        | **4** | Resource **limited and inadequate for or unrelated to the task**. Vocabulary basic and may be repetitive. Possible inappropriate use of lexical chunks (memorised phrases, formulaic language, or input material). Inappropriate word choice and/or spelling/word formation errors **may impede meaning**. |
        | **3** | Resource inadequate (possibly due to significant underlength). Possible over-dependence on input/memorised language. Word choice/spelling very limited; errors predominate and **may severely impede meaning**. |
        | **2** | Resource extremely limited with few recognisable strings, apart from memorised phrases. No apparent control of word formation/spelling. |
        | **1** | No resource apparent except a few isolated words. |
        | **0** | See Band 0 above. |

        ---

        ## Criterion 4: Grammatical Range & Accuracy (GRA)

        Assess the range and accuracy of grammatical structures, including punctuation.

        | Band | Descriptor |
        |------|------------|
        | **9** | Wide range of structures used with full flexibility and control. Punctuation and grammar used appropriately throughout. Minor errors extremely rare with minimal impact. |
        | **8** | Wide range of structures flexibly and accurately used. Majority of sentences error-free; punctuation well managed. Occasional, non-systematic errors/inappropriacies with minimal impact. |
        | **7** | Variety of complex structures used with some flexibility and accuracy. Grammar and punctuation generally well controlled; error-free sentences frequent. A few persistent grammar errors but do not impede communication. |
        | **6** | Mix of simple and complex sentence forms; flexibility limited. More complex structures not as accurate as simple ones. Errors in grammar/punctuation occur but **rarely impede communication**. |
        | **5** | Range of structures limited and rather repetitive. Complex sentences attempted but tend to be faulty; greatest accuracy on simple sentences. Grammatical errors **may be frequent and cause some difficulty**. Punctuation may be faulty. |
        | **4** | Very limited range of structures. **Subordinate clauses rare; simple sentences predominate**. Some accurate structures but grammatical errors frequent and **may impede meaning**. Punctuation often faulty or inadequate. |
        | **3** | Sentence forms attempted but grammar/punctuation errors predominate (except in memorised phrases or input material). **Prevents most meaning from coming through**. **Length may be insufficient to evidence control of sentence forms**. |
        | **2** | Little or no evidence of sentence forms (except in memorised phrases). |
        | **1** | No rateable language evident. |
        | **0** | See Band 0 above. | 


        # Output Format
        "self_check": "<Your detailed internal reasoning process. Begin by stating your initial proposed grade for each domain. Then conduct a self-check: revisit the IELTS band descriptors for each domain and verify whether your scores are justified. Adjust if necessary and explain why.>",
        "overall_band_score": <float, average of pillars rounded to nearest 0.5>,
        "justification": "<A 2-3 sentence overview of the overall performance.>",
        "pillars": {{
            "task_response": {{
                "score": <float, e.g. 7.5>,
                "feedback": "<Justification strictly based on Task Response descriptors>"
            }},
            "coherence_cohesion": {{
                "score": <float>,
                "feedback": "<Justification based on CC descriptors>"
            }},
            "lexical_resource": {{
                "score": <float>,
                "feedback": "<Justification based on LR descriptors>"
            }},
            "grammatical_range_accuracy": {{
                "score": <float>,
                "feedback": "<Justification based on GRA descriptors>"
            }}
        }},
        "errors": [
            {{
                "original": "<exact text fragment>",
                "issue": "<short description of problem>",
                "suggestion": "<corrected version>",
                "error_type": "<grammar|vocabulary|structure|coherence|punctuation|spelling>"
            }}
        ],
        "improvement_notes": [
            {{
                "type": "<vocabulary_upgrade|restructure|formality_adjustment|conciseness|coherence_link|task_fulfilment>",
                "before": "<original fragment or empty>",
                "after": "<improved version>",
                "reason": "<why this raises the band>"
            }}
        ],
        "improved_version": "<A full, Band 9 rewrite of the candidate's essay.>"
        
        """
        task_2_prompt = f"""
        **Input Data:**
        * **Task Question**: {task}
        * **Candidate Submission**: {essay}
        """
        return IELTS_rule + task_2_prompt
